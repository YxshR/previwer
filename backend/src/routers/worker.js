import jwt from "jsonwebtoken";
import { Router } from "express";
import { prismaClient, getNextTask, getWorkerSubmissionHistory } from "../db.js";
import { workerMiddleware } from "../middleware.js";
import { 
  workerSigninInput,
  createSubmissionInput,
  workerPayoutInput,
  workerStatsInput,
  workerTaskHistoryInput,
  validateRequest,
  validateQuery
} from "../types.js";
import solanaService from "../services/solana.js";
import consensusService from "../services/consensus.js";
import { WORKER_JWT_SECRET } from '../config.js';
import dotenv from "dotenv";

dotenv.config();

const router = Router();
const TOTAL_SUBMISSION = 100; // Legacy constant

/**
 * Worker authentication with wallet signature
 */
router.post("/signin", validateRequest(workerSigninInput), async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.validatedData;

    // Validate wallet address format
    if (!solanaService.isValidWalletAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: "Invalid wallet address format"
      });
    }

    // Find or create worker
    let worker = await prismaClient.worker.findFirst({
      where: { address: walletAddress }
    });

    if (!worker) {
      worker = await prismaClient.worker.create({
        data: {
          address: walletAddress,
          pending_amount: 0,
          locked_amount: 0,
          total_earned: 0,
          tasks_completed: 0,
          accuracy_score: 0.0
        }
      });
    }

    // Create session token
    const token = jwt.sign({ workerId: worker.id }, WORKER_JWT_SECRET, { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store session in database
    await prismaClient.workerSession.create({
      data: {
        workerId: worker.id,
        token,
        expiresAt
      }
    });

    res.json({
      success: true,
      data: {
        token,
        worker: {
          id: worker.id,
          address: worker.address,
          totalEarned: worker.total_earned,
          pendingAmount: worker.pending_amount,
          tasksCompleted: worker.tasks_completed,
          accuracyScore: worker.accuracy_score,
          createdAt: worker.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Worker signin error:', error);
    res.status(500).json({
      success: false,
      error: "Authentication failed"
    });
  }
});

/**
 * Get worker profile and statistics
 */
router.get("/profile", workerMiddleware, async (req, res) => {
  try {
    const workerId = req.workerId;

    const worker = await prismaClient.worker.findUnique({
      where: { id: workerId },
      include: {
        submissions: {
          include: {
            task: {
              select: {
                id: true,
                serviceType: true,
                done: true,
                createdAt: true,
                completedAt: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10 // Recent submissions
        },
        withdrawals: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5 // Recent withdrawals
        }
      }
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        error: "Worker not found"
      });
    }

    // Get detailed statistics
    const stats = await consensusService.getWorkerStats(workerId);

    res.json({
      success: true,
      data: {
        worker: {
          id: worker.id,
          address: worker.address,
          createdAt: worker.createdAt,
          updatedAt: worker.updatedAt
        },
        statistics: stats,
        recentSubmissions: worker.submissions,
        recentWithdrawals: worker.withdrawals
      }
    });
  } catch (error) {
    console.error('Get worker profile error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch profile"
    });
  }
});

/**
 * Get next available task for worker
 */
router.get("/nextTask", workerMiddleware, async (req, res) => {
  try {
    const workerId = req.workerId;
    const task = await getNextTask(workerId);

    if (!task) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No more tasks available for review"
      });
    }

    // Add additional task information
    const taskWithInfo = {
      ...task,
      estimatedReward: {
        first: solanaService.calculateWorkerReward(task.serviceType, 1),
        second: solanaService.calculateWorkerReward(task.serviceType, 2),
        third: solanaService.calculateWorkerReward(task.serviceType, 3)
      },
      progress: {
        completed: task._count.submissions,
        required: task.reviewCount,
        percentage: (task._count.submissions / task.reviewCount) * 100
      }
    };

    res.json({
      success: true,
      data: {
        task: taskWithInfo
      }
    });
  } catch (error) {
    console.error('Get next task error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch next task"
    });
  }
});

/**
 * Submit task evaluation
 */
router.post("/submission", workerMiddleware, validateRequest(createSubmissionInput), async (req, res) => {
  try {
    const workerId = req.workerId;
    const { taskId, selection } = req.validatedData;

    console.log(`Worker ${workerId} submitting for task ${taskId}, option ${selection}`);

    // Get the task and validate
    const task = await getNextTask(workerId);
    
    if (!task || task.id !== taskId) {
      return res.status(400).json({
        success: false,
        error: "Invalid task ID or task not available"
      });
    }

    // Validate option selection
    const selectedOption = task.options.find(option => option.id === selection);
    if (!selectedOption) {
      return res.status(400).json({
        success: false,
        error: "Invalid option selection"
      });
    }

    // Calculate base reward amount
    const baseReward = Math.floor(task.amount / task.reviewCount);

    // Create submission and update worker stats
    const result = await prismaClient.$transaction(async (tx) => {
      // Create submission
      const submission = await tx.submission.create({
        data: {
          option_id: selection,
          worker_id: workerId,
          task_id: taskId,
          amount: baseReward
        }
      });

      // Update worker pending amount
      await tx.worker.update({
        where: { id: workerId },
        data: {
          pending_amount: {
            increment: baseReward
          }
        }
      });

      return submission;
    });

    // Check if task is ready for consensus
    const taskStatus = await consensusService.checkTaskCompletion(taskId);
    if (taskStatus.isReadyForConsensus) {
      // Process task completion asynchronously
      consensusService.processTaskCompletion(taskId).catch(error => {
        console.error(`Error processing task completion for task ${taskId}:`, error);
      });
    }

    // Get next task for worker
    const nextTask = await getNextTask(workerId);

    res.json({
      success: true,
      data: {
        submission: {
          id: result.id,
          taskId,
          optionId: selection,
          amount: baseReward,
          createdAt: result.createdAt
        },
        nextTask: nextTask ? {
          ...nextTask,
          estimatedReward: {
            first: solanaService.calculateWorkerReward(nextTask.serviceType, 1),
            second: solanaService.calculateWorkerReward(nextTask.serviceType, 2),
            third: solanaService.calculateWorkerReward(nextTask.serviceType, 3)
          },
          progress: {
            completed: nextTask._count.submissions,
            required: nextTask.reviewCount,
            percentage: (nextTask._count.submissions / nextTask.reviewCount) * 100
          }
        } : null,
        taskProgress: {
          completed: taskStatus.currentSubmissions + 1,
          required: taskStatus.requiredSubmissions,
          percentage: ((taskStatus.currentSubmissions + 1) / taskStatus.requiredSubmissions) * 100
        }
      }
    });
  } catch (error) {
    console.error('Submission error:', error);
    
    // Handle unique constraint violation (worker already submitted for this task)
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: "You have already submitted for this task"
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to submit evaluation"
    });
  }
});

/**
 * Get worker balance and earnings
 */
router.get("/balance", workerMiddleware, async (req, res) => {
  try {
    const workerId = req.workerId;

    const worker = await prismaClient.worker.findUnique({
      where: { id: workerId },
      select: {
        pending_amount: true,
        locked_amount: true,
        total_earned: true,
        tasks_completed: true,
        accuracy_score: true
      }
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        error: "Worker not found"
      });
    }

    // Convert to USD for display
    const pendingUSD = await solanaService.lamportsToUsd(worker.pending_amount);
    const lockedUSD = await solanaService.lamportsToUsd(worker.locked_amount);
    const totalEarnedUSD = await solanaService.lamportsToUsd(worker.total_earned);

    res.json({
      success: true,
      data: {
        balance: {
          pending: {
            lamports: worker.pending_amount,
            sol: worker.pending_amount / 1000000000,
            usd: pendingUSD
          },
          locked: {
            lamports: worker.locked_amount,
            sol: worker.locked_amount / 1000000000,
            usd: lockedUSD
          },
          totalEarned: {
            lamports: worker.total_earned,
            sol: worker.total_earned / 1000000000,
            usd: totalEarnedUSD
          }
        },
        statistics: {
          tasksCompleted: worker.tasks_completed,
          accuracyScore: worker.accuracy_score
        }
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch balance"
    });
  }
});

/**
 * Request payout/withdrawal
 */
router.post("/payout", workerMiddleware, validateRequest(workerPayoutInput), async (req, res) => {
  try {
    const workerId = req.workerId;
    const { amount } = req.validatedData;

    const worker = await prismaClient.worker.findUnique({
      where: { id: workerId }
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        error: "Worker not found"
      });
    }

    // Determine payout amount
    const payoutAmount = amount || worker.pending_amount;

    if (payoutAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "No funds available for payout"
      });
    }

    if (payoutAmount > worker.pending_amount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient pending balance"
      });
    }

    // Process payout
    const result = await prismaClient.$transaction(async (tx) => {
      // Update worker balances
      await tx.worker.update({
        where: { id: workerId },
        data: {
          pending_amount: {
            decrement: payoutAmount
          },
          locked_amount: {
            increment: payoutAmount
          }
        }
      });

      // Create withdrawal record
      const withdrawal = await tx.workerWithdrawal.create({
        data: {
          workerId,
          amount: payoutAmount,
          signature: "pending", // Will be updated when transaction is processed
          status: "Processing"
        }
      });

      return withdrawal;
    });

    // Process Solana transaction (in production, this would be real)
    try {
      const txSignature = await solanaService.sendReward(worker.address, payoutAmount);
      
      // Update withdrawal with transaction signature
      await prismaClient.workerWithdrawal.update({
        where: { id: result.id },
        data: {
          signature: txSignature,
          status: "Success",
          processedAt: new Date()
        }
      });

      // Update worker locked amount back to 0 and mark as processed
      await prismaClient.worker.update({
        where: { id: workerId },
        data: {
          locked_amount: {
            decrement: payoutAmount
          }
        }
      });

    } catch (txError) {
      console.error('Transaction failed:', txError);
      
      // Revert the withdrawal
      await prismaClient.$transaction(async (tx) => {
        await tx.workerWithdrawal.update({
          where: { id: result.id },
          data: {
            status: "Failure",
            processedAt: new Date()
          }
        });

        await tx.worker.update({
          where: { id: workerId },
          data: {
            pending_amount: {
              increment: payoutAmount
            },
            locked_amount: {
              decrement: payoutAmount
            }
          }
        });
      });

      return res.status(500).json({
        success: false,
        error: "Transaction failed, funds returned to pending balance"
      });
    }

    res.json({
      success: true,
      data: {
        withdrawal: {
          id: result.id,
          amount: payoutAmount,
          amountSOL: payoutAmount / 1000000000,
          amountUSD: await solanaService.lamportsToUsd(payoutAmount),
          status: "Success",
          createdAt: result.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Payout error:', error);
    res.status(500).json({
      success: false,
      error: "Payout processing failed"
    });
  }
});

/**
 * Get worker's submission history
 */
router.get("/history", workerMiddleware, validateQuery(workerTaskHistoryInput), async (req, res) => {
  try {
    const workerId = req.workerId;
    const queryOptions = req.validatedQuery;

    const { submissions, pagination } = await getWorkerSubmissionHistory(workerId, queryOptions);

    // Add reward information to submissions
    const submissionsWithRewards = await Promise.all(
      submissions.map(async (submission) => {
        // Check if task is completed and get results
        if (submission.task.done) {
          const taskResults = await consensusService.getTaskResults(submission.task.id);
          if (taskResults) {
            const optionResult = taskResults.results.find(r => r.optionId === submission.option_id);
            return {
              ...submission,
              reward: {
                rank: optionResult?.rank || null,
                percentage: optionResult?.percentage || 0,
                actualReward: optionResult?.rank <= 3 ? 
                  solanaService.calculateWorkerReward(submission.task.serviceType, optionResult.rank) : 0
              }
            };
          }
        }
        
        return {
          ...submission,
          reward: {
            rank: null,
            percentage: 0,
            actualReward: 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        submissions: submissionsWithRewards,
        pagination
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch submission history"
    });
  }
});

/**
 * Get worker statistics and performance metrics
 */
router.get("/stats", workerMiddleware, async (req, res) => {
  try {
    const workerId = req.workerId;
    const stats = await consensusService.getWorkerStats(workerId);

    // Get additional metrics
    const worker = await prismaClient.worker.findUnique({
      where: { id: workerId },
      include: {
        submissions: {
          include: {
            task: {
              select: {
                serviceType: true,
                done: true,
                createdAt: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        withdrawals: {
          where: {
            status: 'Success'
          }
        }
      }
    });

    // Calculate service type breakdown
    const serviceTypeStats = {};
    worker.submissions.forEach(submission => {
      const serviceType = submission.task.serviceType;
      if (!serviceTypeStats[serviceType]) {
        serviceTypeStats[serviceType] = {
          total: 0,
          completed: 0
        };
      }
      serviceTypeStats[serviceType].total++;
      if (submission.task.done) {
        serviceTypeStats[serviceType].completed++;
      }
    });

    // Calculate earnings over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentEarnings = worker.submissions
      .filter(s => s.createdAt >= thirtyDaysAgo && s.task.done)
      .reduce((sum, s) => sum + s.amount, 0);

    res.json({
      success: true,
      data: {
        ...stats,
        serviceTypeBreakdown: serviceTypeStats,
        recentEarnings: {
          lamports: recentEarnings,
          sol: recentEarnings / 1000000000,
          usd: await solanaService.lamportsToUsd(recentEarnings)
        },
        totalWithdrawals: worker.withdrawals.length,
        totalWithdrawnAmount: worker.withdrawals.reduce((sum, w) => sum + w.amount, 0)
      }
    });
  } catch (error) {
    console.error('Get worker stats error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics"
    });
  }
});

/**
 * Get withdrawal history
 */
router.get("/withdrawals", workerMiddleware, async (req, res) => {
  try {
    const workerId = req.workerId;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [withdrawals, total] = await Promise.all([
      prismaClient.workerWithdrawal.findMany({
        where: { workerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prismaClient.workerWithdrawal.count({
        where: { workerId }
      })
    ]);

    // Add USD amounts
    const withdrawalsWithUSD = await Promise.all(
      withdrawals.map(async (withdrawal) => ({
        ...withdrawal,
        amountSOL: withdrawal.amount / 1000000000,
        amountUSD: await solanaService.lamportsToUsd(withdrawal.amount)
      }))
    );

    res.json({
      success: true,
      data: {
        withdrawals: withdrawalsWithUSD,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch withdrawal history"
    });
  }
});

export default router;