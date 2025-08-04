import express from "express";
import { createServer } from "http";
import cors from "cors";
import cron from "node-cron";
import winston from "winston";
import userRouter from "./routers/user.js";
import workerRouter from "./routers/worker.js";
import databaseService, { updateSystemStats, cleanupExpiredSessions } from "./db.js";
import websocketService from "./services/websocket.js";
import consensusService from "./services/consensus.js";
import ipfsService from "./services/ipfs.js";
import dotenv from "dotenv";

dotenv.config();

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'previewer-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

class PreviewerServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.port = process.env.PORT || 3000;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupScheduledTasks();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ["https://your-user-frontend.com", "https://your-worker-frontend.com"]
        : ["http://localhost:3001", "http://localhost:3002"],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Request logging middleware
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      });
      
      next();
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API info endpoint
    this.app.get('/api/info', (req, res) => {
      res.json({
        name: 'Previewer API',
        version: '1.0.0',
        description: 'Content evaluation platform with Solana payments',
        endpoints: {
          users: '/v1/user',
          workers: '/v1/worker'
        },
        features: [
          'Multi-wallet support',
          'IPFS file storage',
          'Real-time WebSocket updates',
          'Solana blockchain integration',
          'Worker consensus algorithm'
        ]
      });
    });
  }

  setupRoutes() {
    // API routes
    this.app.use("/v1/user", userRouter);
    this.app.use("/v1/worker", workerRouter);

    // Admin routes (for future admin panel)
    this.app.get("/admin/stats", async (req, res) => {
      try {
        const stats = await updateSystemStats();
        const connectionStats = websocketService.getConnectionStats();
        
        res.json({
          success: true,
          data: {
            system: stats,
            connections: connectionStats,
            server: {
              uptime: process.uptime(),
              memory: process.memoryUsage(),
              nodeVersion: process.version
            }
          }
        });
      } catch (error) {
        logger.error('Admin stats error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch admin stats'
        });
      }
    });

    // Force consensus calculation (admin only)
    this.app.post("/admin/force-consensus/:taskId", async (req, res) => {
      try {
        const { taskId } = req.params;
        const result = await consensusService.processTaskCompletion(parseInt(taskId));
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        logger.error('Force consensus error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to process consensus'
        });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl
      });
    });
  }

  setupWebSocket() {
    websocketService.initialize(this.server);
    logger.info('WebSocket service initialized');
  }

  setupScheduledTasks() {
    // Process ready tasks every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        logger.info('Running scheduled task processing...');
        const processedTasks = await consensusService.processReadyTasks();
        
        if (processedTasks.length > 0) {
          logger.info(`Processed ${processedTasks.length} tasks in scheduled run`);
          
          // Notify about completed tasks
          processedTasks.forEach(task => {
            websocketService.notifyTaskCompletion(task.taskId, task.consensus);
          });
        }
      } catch (error) {
        logger.error('Scheduled task processing error:', error);
      }
    });

    // Update system stats every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
      try {
        logger.info('Updating system statistics...');
        const stats = await updateSystemStats();
        websocketService.broadcastSystemStats(stats);
      } catch (error) {
        logger.error('System stats update error:', error);
      }
    });

    // Clean up expired sessions every hour
    cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Cleaning up expired sessions...');
        const cleaned = await cleanupExpiredSessions();
        logger.info(`Cleaned up ${cleaned} expired sessions`);
      } catch (error) {
        logger.error('Session cleanup error:', error);
      }
    });

    // Health check for external services every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      try {
        logger.info('Checking external service health...');
        
        // Check database connection
        const dbHealthy = await databaseService.testConnection();
        
        // Check IPFS connection
        const ipfsHealthy = await ipfsService.checkConnection();
        
        logger.info(`Service health - DB: ${dbHealthy}, IPFS: ${ipfsHealthy}`);
        
        if (!dbHealthy || !ipfsHealthy) {
          logger.warn('Some external services are unhealthy');
        }
      } catch (error) {
        logger.error('Service health check error:', error);
      }
    });

    logger.info('Scheduled tasks configured');
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        body: req.body
      });

      // Don't leak error details in production
      const isDevelopment = process.env.NODE_ENV !== 'production';
      
      res.status(error.status || 500).json({
        success: false,
        error: isDevelopment ? error.message : 'Internal server error',
        ...(isDevelopment && { stack: error.stack })
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      this.shutdown();
    });
  }

  async initialize() {
    try {
      logger.info('Initializing Previewer server...');
      
      // Test database connection
      const dbConnected = await databaseService.testConnection();
      if (!dbConnected) {
        throw new Error('Database connection failed');
      }

      // Initialize database
      await databaseService.initialize();
      
      // Test IPFS connection
      const ipfsConnected = await ipfsService.checkConnection();
      if (!ipfsConnected) {
        logger.warn('IPFS connection failed - file uploads may not work properly');
      }

      logger.info('Server initialization completed successfully');
      return true;
    } catch (error) {
      logger.error('Server initialization failed:', error);
      return false;
    }
  }

  async start() {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        process.exit(1);
      }

      this.server.listen(this.port, () => {
        logger.info(`🚀 Previewer server running on port ${this.port}`);
        logger.info(`📊 Health check: http://localhost:${this.port}/health`);
        logger.info(`📡 WebSocket server ready for connections`);
        logger.info(`🔗 API endpoints: http://localhost:${this.port}/v1/`);
        
        if (process.env.NODE_ENV !== 'production') {
          logger.info(`🛠️  Development mode - CORS enabled for localhost`);
        }
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async shutdown() {
    logger.info('Shutting down server...');
    
    try {
      // Close HTTP server
      await new Promise((resolve) => {
        this.server.close(resolve);
      });
      
      // Close database connections
      await databaseService.getClient().$disconnect();
      
      logger.info('Server shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Create and start server
const server = new PreviewerServer();
server.start();

// Export for testing
export default server;