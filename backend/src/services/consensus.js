import pkg from '@prisma/client';
import solanaService from './solana.js';
import dotenv from 'dotenv';

dotenv.config();

const { PrismaClient } = pkg;
const prismaClient = new PrismaClient();

class ConsensusService {
  constructor() {
    this.MINIMUM_SUBMISSIONS_THRESHOLD = 0.8; // 80% of required submissions
  }

  /**
   * Check if a task has enough submissions to calculate consensus
   * @param {number} taskId - Task ID to check
   * @returns {Promise<Object>} Task status and submission count
   */
  async checkTaskCompletion(taskId) {
    try {
      const task = await prismaClient.task.findUnique({
        where: { id: taskId },
        include: {
          submissions: true,
          options: true
        }
      });

      if (!task) {
        throw new Error('Task not found');
      }

      const requiredSubmissions = task.reviewCount;
      const currentSubmissions = task.submissions.length;
      const completionPercentage = currentSubmissions / requiredSubmissions;

      return {
        taskId,
        requiredSubmissions,
        currentSubmissions,
        completionPercentage,
        isReadyForConsensus: completionPercentage >= this.MINIMUM_SUBMISSIONS_THRESHOLD,
        task
      };
    } catch (error) {
      console.error('Error checking task completion:', error);
      throw error;
    }
  }

  /**
   * Calculate consensus results for a completed task
   * @param {number} taskId - Task ID to calculate consensus for
   * @returns {Promise<Object>} Consensus results
   */
  async calculateConsensus(taskId) {
    try {
      const taskStatus = await this.checkTaskCompletion(taskId);
      
      if (!taskStatus.isReadyForConsensus) {
        throw new Error('Task does not have enough submissions for consensus');
      }

      const { task } = taskStatus;
      
      // Count votes for each option
      const voteCounts = {};
      task.options.forEach(option => {
        voteCounts[option.id] = {
          optionId: option.id,
          count: 0,
          voters: [],
          option: option
        };
      });

      // Tally votes
      task.submissions.forEach(submission => {
        if (voteCounts[submission.option_id]) {
          voteCounts[submission.option_id].count++;
          voteCounts[submission.option_id].voters.push(submission.worker_id);
        }
      });

      // Sort options by vote count (descending)
      const sortedResults = Object.values(voteCounts)
        .sort((a, b) => b.count - a.count)
        .map((result, index) => ({
          ...result,
          rank: index + 1,
          percentage: (result.count / task.submissions.length) * 100
        }));

      // Calculate worker rewards based on consensus
      const workerRewards = await this.calculateWorkerRewards(task, sortedResults);

      return {
        taskId,
        totalSubmissions: task.submissions.length,
        results: sortedResults,
        workerRewards,
        consensusReached: true
      };
    } catch (error) {
      console.error('Error calculating consensus:', error);
      throw error;
    }
  }

  /**
   * Calculate rewards for workers based on consensus results
   * @param {Object} task - Task object
   * @param {Array} consensusResults - Sorted consensus results
   * @returns {Promise<Array>} Worker rewards
   */
  async calculateWorkerRewards(task, consensusResults) {
    try {
      const workerRewards = [];
      
      // Get top 3 options for rewards
      const rewardableOptions = consensusResults.slice(0, 3);
      
      for (const [index, result] of rewardableOptions.entries()) {
        const rank = index + 1;
        const rewardAmount = solanaService.calculateWorkerReward(task.serviceType, rank);
        
        // Reward all workers who voted for this option
        for (const workerId of result.voters) {
          workerRewards.push({
            workerId,
            optionId: result.optionId,
            rank,
            amount: rewardAmount,
            percentage: result.percentage
          });
        }
      }

      return workerRewards;
    } catch (error) {
      console.error('Error calculating worker rewards:', error);
      throw error;
    }
  }

  /**
   * Process task completion and distribute rewards
   * @param {number} taskId - Task ID to process
   * @returns {Promise<Object>} Processing result
   */
  async processTaskCompletion(taskId) {
    try {
      console.log(`Processing task completion for task ${taskId}`);
      
      // Calculate consensus
      const consensus = await this.calculateConsensus(taskId);
      
      // Start database transaction for atomic operations
      const result = await prismaClient.$transaction(async (tx) => {
        // Mark task as completed
        await tx.task.update({
          where: { id: taskId },
          data: {
            done: true,
            completedAt: new Date()
          }
        });

        // Create task results
        const taskResult = await tx.taskResult.create({
          data: {
            task_id: taskId
          }
        });

        // Create option results
        for (const result of consensus.results) {
          await tx.optionResult.create({
            data: {
              option_id: result.optionId,
              task_result_id: taskResult.id,
              vote_count: result.count,
              rank: result.rank,
              percentage: result.percentage
            }
          });
        }

        // Distribute rewards to workers
        const rewardTransactions = [];
        for (const reward of consensus.workerRewards) {
          // Update worker pending amount
          await tx.worker.update({
            where: { id: reward.workerId },
            data: {
              pending_amount: {
                increment: reward.amount
              },
              total_earned: {
                increment: reward.amount
              },
              tasks_completed: {
                increment: 1
              }
            }
          });

          // Create reward transaction record
          const rewardTx = await solanaService.sendReward(
            (await tx.worker.findUnique({ where: { id: reward.workerId } })).address,
            reward.amount
          );

          rewardTransactions.push({
            workerId: reward.workerId,
            amount: reward.amount,
            signature: rewardTx,
            rank: reward.rank
          });
        }

        return {
          taskId,
          consensus,
          rewardTransactions,
          completedAt: new Date()
        };
      });

      console.log(`Task ${taskId} completed successfully with ${result.rewardTransactions.length} rewards distributed`);
      
      return result;
    } catch (error) {
      console.error('Error processing task completion:', error);
      throw error;
    }
  }

  /**
   * Get consensus results for a completed task
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} Consensus results
   */
  async getTaskResults(taskId) {
    try {
      const taskResult = await prismaClient.taskResult.findUnique({
        where: { task_id: taskId },
        include: {
          results: {
            include: {
              option: true
            },
            orderBy: {
              rank: 'asc'
            }
          },
          task: {
            include: {
              submissions: {
                include: {
                  worker: true,
                  option: true
                }
              }
            }
          }
        }
      });

      if (!taskResult) {
        return null;
      }

      return {
        taskId,
        totalSubmissions: taskResult.task.submissions.length,
        results: taskResult.results.map(result => ({
          optionId: result.option_id,
          rank: result.rank,
          voteCount: result.vote_count,
          percentage: result.percentage,
          option: result.option
        })),
        completedAt: taskResult.createdAt
      };
    } catch (error) {
      console.error('Error getting task results:', error);
      throw error;
    }
  }

  /**
   * Check and process all tasks ready for consensus
   * @returns {Promise<Array>} Processed tasks
   */
  async processReadyTasks() {
    try {
      console.log('Checking for tasks ready for consensus...');
      
      const incompleteTasks = await prismaClient.task.findMany({
        where: { done: false },
        include: {
          submissions: true
        }
      });

      const processedTasks = [];
      
      for (const task of incompleteTasks) {
        const completionPercentage = task.submissions.length / task.reviewCount;
        
        if (completionPercentage >= this.MINIMUM_SUBMISSIONS_THRESHOLD) {
          try {
            const result = await this.processTaskCompletion(task.id);
            processedTasks.push(result);
          } catch (error) {
            console.error(`Error processing task ${task.id}:`, error);
          }
        }
      }

      console.log(`Processed ${processedTasks.length} tasks`);
      return processedTasks;
    } catch (error) {
      console.error('Error processing ready tasks:', error);
      throw error;
    }
  }

  /**
   * Get worker performance statistics
   * @param {number} workerId - Worker ID
   * @returns {Promise<Object>} Worker statistics
   */
  async getWorkerStats(workerId) {
    try {
      const worker = await prismaClient.worker.findUnique({
        where: { id: workerId },
        include: {
          submissions: {
            include: {
              task: {
                include: {
                  results: {
                    include: {
                      results: true
                    }
                  }
                }
              },
              option: true
            }
          }
        }
      });

      if (!worker) {
        throw new Error('Worker not found');
      }

      // Calculate accuracy based on consensus alignment
      let correctSubmissions = 0;
      let totalCompletedSubmissions = 0;

      for (const submission of worker.submissions) {
        if (submission.task.done && submission.task.results.length > 0) {
          totalCompletedSubmissions++;
          
          // Check if worker's choice was in top 3
          const taskResults = submission.task.results[0].results;
          const workerChoice = taskResults.find(r => r.option_id === submission.option_id);
          
          if (workerChoice && workerChoice.rank <= 3) {
            correctSubmissions++;
          }
        }
      }

      const accuracy = totalCompletedSubmissions > 0 
        ? (correctSubmissions / totalCompletedSubmissions) * 100 
        : 0;

      return {
        workerId,
        totalEarned: worker.total_earned,
        pendingAmount: worker.pending_amount,
        lockedAmount: worker.locked_amount,
        tasksCompleted: worker.tasks_completed,
        accuracy: Math.round(accuracy * 100) / 100,
        totalSubmissions: worker.submissions.length,
        completedSubmissions: totalCompletedSubmissions
      };
    } catch (error) {
      console.error('Error getting worker stats:', error);
      throw error;
    }
  }
}

export default new ConsensusService();