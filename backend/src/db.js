import { PrismaClient } from './generated/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();

// Create a singleton Prisma client instance
class DatabaseService {
  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    });
    
    // Handle graceful shutdown
    this.setupGracefulShutdown();
  }

  setupGracefulShutdown() {
    process.on('beforeExit', async () => {
      console.log('Disconnecting from database...');
      await this.prisma.$disconnect();
    });

    process.on('SIGINT', async () => {
      console.log('Received SIGINT, disconnecting from database...');
      await this.prisma.$disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, disconnecting from database...');
      await this.prisma.$disconnect();
      process.exit(0);
    });
  }

  // Get the Prisma client instance
  getClient() {
    return this.prisma;
  }

  // Test database connection
  async testConnection() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      console.log('Database connection successful');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  // Initialize database with default data
  async initialize() {
    try {
      console.log('Initializing database...');
      
      // Create system stats record if it doesn't exist
      const existingStats = await this.prisma.systemStats.findFirst();
      if (!existingStats) {
        await this.prisma.systemStats.create({
          data: {
            total_workers: 0,
            active_workers: 0,
            total_tasks_completed: 0,
            total_earnings_paid: 0
          }
        });
        console.log('System stats initialized');
      }

      console.log('Database initialization complete');
      return true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService();
const prismaClient = databaseService.getClient();

// Export both the service and client for backward compatibility
export default databaseService;
export { prismaClient };

// Helper functions for common database operations

/**
 * Get the next available task for a worker
 * @param {number} userId - Worker ID
 * @returns {Promise<Object|null>} Next task or null
 */
export const getNextTask = async (userId) => {
  try {
    const task = await prismaClient.task.findFirst({
      where: {
        done: false,
        submissions: {
          none: {
            worker_id: userId,
          }
        }
      },
      select: {
        id: true,
        amount: true,
        title: true,
        serviceType: true,
        reviewCount: true,
        options: {
          select: {
            id: true,
            image_url: true,
            video_url: true,
            ipfs_hash: true,
            file_type: true
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // FIFO order
      }
    });

    return task;
  } catch (error) {
    console.error('Error getting next task:', error);
    throw error;
  }
};

/**
 * Get user's task history with pagination
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated task history
 */
export const getUserTaskHistory = async (userId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'all',
      serviceType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    
    const where = {
      user_id: userId,
      ...(status !== 'all' && { done: status === 'completed' }),
      ...(serviceType && { serviceType })
    };

    const [tasks, total] = await Promise.all([
      prismaClient.task.findMany({
        where,
        include: {
          options: true,
          submissions: {
            select: {
              id: true,
              worker_id: true,
              createdAt: true
            }
          },
          results: {
            include: {
              results: {
                include: {
                  option: true
                },
                orderBy: {
                  rank: 'asc'
                }
              }
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit
      }),
      prismaClient.task.count({ where })
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting user task history:', error);
    throw error;
  }
};

/**
 * Get worker's submission history with pagination
 * @param {number} workerId - Worker ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated submission history
 */
export const getWorkerSubmissionHistory = async (workerId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    
    const where = {
      worker_id: workerId,
      ...(status !== 'all' && { 
        task: { 
          done: status === 'completed' 
        } 
      })
    };

    const [submissions, total] = await Promise.all([
      prismaClient.submission.findMany({
        where,
        include: {
          task: {
            select: {
              id: true,
              title: true,
              serviceType: true,
              done: true,
              createdAt: true,
              completedAt: true
            }
          },
          option: {
            select: {
              id: true,
              image_url: true,
              video_url: true,
              file_type: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit
      }),
      prismaClient.submission.count({ where })
    ]);

    return {
      submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting worker submission history:', error);
    throw error;
  }
};

/**
 * Update system statistics
 * @returns {Promise<Object>} Updated stats
 */
export const updateSystemStats = async () => {
  try {
    const [
      totalWorkers,
      activeWorkers,
      totalTasksCompleted,
      totalEarningsPaid
    ] = await Promise.all([
      prismaClient.worker.count(),
      prismaClient.worker.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Active in last 24h
          }
        }
      }),
      prismaClient.task.count({
        where: { done: true }
      }),
      prismaClient.worker.aggregate({
        _sum: {
          total_earned: true
        }
      })
    ]);

    const stats = await prismaClient.systemStats.upsert({
      where: { id: 1 },
      update: {
        total_workers: totalWorkers,
        active_workers: activeWorkers,
        total_tasks_completed: totalTasksCompleted,
        total_earnings_paid: totalEarningsPaid._sum.total_earned || 0
      },
      create: {
        total_workers: totalWorkers,
        active_workers: activeWorkers,
        total_tasks_completed: totalTasksCompleted,
        total_earnings_paid: totalEarningsPaid._sum.total_earned || 0
      }
    });

    return stats;
  } catch (error) {
    console.error('Error updating system stats:', error);
    throw error;
  }
};

/**
 * Clean up expired sessions
 * @returns {Promise<number>} Number of cleaned sessions
 */
export const cleanupExpiredSessions = async () => {
  try {
    const now = new Date();
    
    const [userSessions, workerSessions] = await Promise.all([
      prismaClient.userSession.deleteMany({
        where: {
          expiresAt: {
            lt: now
          }
        }
      }),
      prismaClient.workerSession.deleteMany({
        where: {
          expiresAt: {
            lt: now
          }
        }
      })
    ]);

    const totalCleaned = userSessions.count + workerSessions.count;
    console.log(`Cleaned up ${totalCleaned} expired sessions`);
    
    return totalCleaned;
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    throw error;
  }
};