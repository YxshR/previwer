import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prismaClient } from '../db.js';
import { WORKER_JWT_SECRET } from '../config.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

class WebSocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> socket
    this.workerSockets = new Map(); // workerId -> socket
  }

  /**
   * Initialize WebSocket server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ["https://your-user-frontend.com", "https://your-worker-frontend.com"]
          : ["http://localhost:3001", "http://localhost:3002"],
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    console.log('WebSocket server initialized');
  }

  /**
   * Set up WebSocket event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate_user', async (data) => {
        try {
          const { token } = data;
          const decoded = jwt.verify(token, JWT_SECRET);
          
          // Verify user exists and session is valid
          const session = await prismaClient.userSession.findFirst({
            where: {
              token,
              expiresAt: {
                gt: new Date()
              }
            },
            include: {
              user: true
            }
          });

          if (session) {
            socket.userId = session.userId;
            socket.userType = 'user';
            this.userSockets.set(session.userId, socket);
            
            socket.emit('authenticated', {
              success: true,
              user: {
                id: session.user.id,
                address: session.user.address
              }
            });

            // Join user-specific room
            socket.join(`user_${session.userId}`);
            console.log(`User ${session.userId} authenticated and joined room`);
          } else {
            socket.emit('authentication_failed', { error: 'Invalid or expired token' });
          }
        } catch (error) {
          console.error('User authentication error:', error);
          socket.emit('authentication_failed', { error: 'Authentication failed' });
        }
      });

      // Handle worker authentication
      socket.on('authenticate_worker', async (data) => {
        try {
          const { token } = data;
          const decoded = jwt.verify(token, WORKER_JWT_SECRET);
          
          // Verify worker exists and session is valid
          const session = await prismaClient.workerSession.findFirst({
            where: {
              token,
              expiresAt: {
                gt: new Date()
              }
            },
            include: {
              worker: true
            }
          });

          if (session) {
            socket.workerId = session.workerId;
            socket.userType = 'worker';
            this.workerSockets.set(session.workerId, socket);
            
            socket.emit('authenticated', {
              success: true,
              worker: {
                id: session.worker.id,
                address: session.worker.address,
                pendingAmount: session.worker.pending_amount,
                totalEarned: session.worker.total_earned
              }
            });

            // Join worker-specific room and general workers room
            socket.join(`worker_${session.workerId}`);
            socket.join('workers');
            console.log(`Worker ${session.workerId} authenticated and joined rooms`);
          } else {
            socket.emit('authentication_failed', { error: 'Invalid or expired token' });
          }
        } catch (error) {
          console.error('Worker authentication error:', error);
          socket.emit('authentication_failed', { error: 'Authentication failed' });
        }
      });

      // Handle task updates subscription
      socket.on('subscribe_task_updates', (data) => {
        const { taskId } = data;
        if (socket.userId || socket.workerId) {
          socket.join(`task_${taskId}`);
          console.log(`Client subscribed to task ${taskId} updates`);
        }
      });

      // Handle system stats subscription
      socket.on('subscribe_system_stats', () => {
        socket.join('system_stats');
        console.log('Client subscribed to system stats');
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        if (socket.userId) {
          this.userSockets.delete(socket.userId);
        }
        
        if (socket.workerId) {
          this.workerSockets.delete(socket.workerId);
        }
      });

      // Handle ping for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  /**
   * Notify user about task progress
   * @param {number} userId - User ID
   * @param {Object} taskUpdate - Task update data
   */
  notifyUserTaskUpdate(userId, taskUpdate) {
    try {
      this.io.to(`user_${userId}`).emit('task_update', {
        type: 'task_progress',
        data: taskUpdate,
        timestamp: new Date().toISOString()
      });

      // Also notify task-specific subscribers
      if (taskUpdate.taskId) {
        this.io.to(`task_${taskUpdate.taskId}`).emit('task_update', {
          type: 'task_progress',
          data: taskUpdate,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error notifying user task update:', error);
    }
  }

  /**
   * Notify worker about new task availability
   * @param {number} workerId - Worker ID (optional, if null notifies all workers)
   * @param {Object} taskData - New task data
   */
  notifyWorkerNewTask(workerId, taskData) {
    try {
      const event = {
        type: 'new_task_available',
        data: taskData,
        timestamp: new Date().toISOString()
      };

      if (workerId) {
        this.io.to(`worker_${workerId}`).emit('new_task', event);
      } else {
        this.io.to('workers').emit('new_task', event);
      }
    } catch (error) {
      console.error('Error notifying worker new task:', error);
    }
  }

  /**
   * Notify worker about earnings update
   * @param {number} workerId - Worker ID
   * @param {Object} earningsData - Earnings update data
   */
  notifyWorkerEarnings(workerId, earningsData) {
    try {
      this.io.to(`worker_${workerId}`).emit('earnings_update', {
        type: 'earnings_update',
        data: earningsData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error notifying worker earnings:', error);
    }
  }

  /**
   * Notify about task completion and results
   * @param {number} taskId - Task ID
   * @param {Object} results - Task results
   */
  notifyTaskCompletion(taskId, results) {
    try {
      const event = {
        type: 'task_completed',
        data: {
          taskId,
          results,
          completedAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };

      // Notify task subscribers
      this.io.to(`task_${taskId}`).emit('task_completed', event);

      // Notify task owner
      if (results.userId) {
        this.io.to(`user_${results.userId}`).emit('task_completed', event);
      }

      // Notify workers who participated
      if (results.workerRewards) {
        results.workerRewards.forEach(reward => {
          this.io.to(`worker_${reward.workerId}`).emit('reward_received', {
            type: 'reward_received',
            data: {
              taskId,
              amount: reward.amount,
              rank: reward.rank,
              percentage: reward.percentage
            },
            timestamp: new Date().toISOString()
          });
        });
      }
    } catch (error) {
      console.error('Error notifying task completion:', error);
    }
  }

  /**
   * Broadcast system statistics update
   * @param {Object} stats - System statistics
   */
  broadcastSystemStats(stats) {
    try {
      this.io.to('system_stats').emit('system_stats_update', {
        type: 'system_stats',
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error broadcasting system stats:', error);
    }
  }

  /**
   * Notify worker about payout status
   * @param {number} workerId - Worker ID
   * @param {Object} payoutData - Payout information
   */
  notifyWorkerPayout(workerId, payoutData) {
    try {
      this.io.to(`worker_${workerId}`).emit('payout_update', {
        type: 'payout_update',
        data: payoutData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error notifying worker payout:', error);
    }
  }

  /**
   * Get connected users count
   * @returns {Object} Connection statistics
   */
  getConnectionStats() {
    return {
      totalConnections: this.io.sockets.sockets.size,
      connectedUsers: this.userSockets.size,
      connectedWorkers: this.workerSockets.size,
      rooms: Array.from(this.io.sockets.adapter.rooms.keys())
    };
  }

  /**
   * Send message to specific user
   * @param {number} userId - User ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  sendToUser(userId, event, data) {
    try {
      this.io.to(`user_${userId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error sending ${event} to user ${userId}:`, error);
    }
  }

  /**
   * Send message to specific worker
   * @param {number} workerId - Worker ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  sendToWorker(workerId, event, data) {
    try {
      this.io.to(`worker_${workerId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error sending ${event} to worker ${workerId}:`, error);
    }
  }

  /**
   * Broadcast message to all connected clients
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  broadcast(event, data) {
    try {
      this.io.emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error broadcasting ${event}:`, error);
    }
  }
}

export default new WebSocketService();