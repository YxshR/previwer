import z from "zod";

// Service type enum
export const ServiceTypeEnum = z.enum(['MARKETING_IMAGES', 'YOUTUBE_THUMBNAILS', 'VIDEOS']);

// File type enum
export const FileTypeEnum = z.enum(['IMAGE', 'VIDEO']);

// Transaction status enum
export const TxnStatusEnum = z.enum(['Processing', 'Success', 'Failure']);

// User authentication
export const userSigninInput = z.object({
  walletAddress: z.string().min(32, "Invalid wallet address"),
  signature: z.string().optional(),
  message: z.string().optional()
});

// Worker authentication
export const workerSigninInput = z.object({
  walletAddress: z.string().min(32, "Invalid wallet address"),
  signature: z.string().optional(),
  message: z.string().optional()
});

// Task creation input
export const createTaskInput = z.object({
  title: z.string().optional().default("Select the most clickable content"),
  serviceType: ServiceTypeEnum,
  reviewCount: z.number().int().positive(),
  options: z.array(z.object({
    imageUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
    ipfsHash: z.string().optional(),
    fileType: FileTypeEnum
  })).min(2).max(5),
  signature: z.string().min(1, "Transaction signature is required"),
  amount: z.number().int().positive()
});

// Task submission input
export const createSubmissionInput = z.object({
  taskId: z.string().transform(val => parseInt(val)),
  selection: z.string().transform(val => parseInt(val))
});

// File upload input
export const fileUploadInput = z.object({
  serviceType: ServiceTypeEnum,
  reviewCount: z.number().int().positive(),
  files: z.array(z.object({
    filename: z.string(),
    mimetype: z.string(),
    size: z.number().int().positive().max(50 * 1024 * 1024), // 50MB max
    buffer: z.any() // File buffer
  })).min(1).max(5)
});

// Payment verification input
export const paymentVerificationInput = z.object({
  signature: z.string().min(1, "Transaction signature is required"),
  amount: z.number().int().positive(),
  serviceType: ServiceTypeEnum,
  reviewCount: z.number().int().positive()
});

// Worker payout request
export const workerPayoutInput = z.object({
  amount: z.number().int().positive().optional() // If not provided, payout all pending
});

// Task query parameters
export const taskQueryInput = z.object({
  taskId: z.string().transform(val => parseInt(val)),
  includeResults: z.boolean().optional().default(false)
});

// Worker stats query
export const workerStatsInput = z.object({
  workerId: z.string().transform(val => parseInt(val)).optional(),
  includeHistory: z.boolean().optional().default(false)
});

// Pagination input
export const paginationInput = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// User task history query
export const userTaskHistoryInput = z.object({
  status: z.enum(['all', 'pending', 'completed']).optional().default('all'),
  serviceType: ServiceTypeEnum.optional(),
  ...paginationInput.shape
});

// Worker task history query
export const workerTaskHistoryInput = z.object({
  status: z.enum(['all', 'pending', 'completed']).optional().default('all'),
  ...paginationInput.shape
});

// System stats input
export const systemStatsInput = z.object({
  timeRange: z.enum(['24h', '7d', '30d', '90d', 'all']).optional().default('24h')
});

// Wallet connection input
export const walletConnectionInput = z.object({
  publicKey: z.string().min(32, "Invalid public key"),
  walletType: z.enum(['phantom', 'solflare', 'metamask', 'other']).optional()
});

// File metadata input
export const fileMetadataInput = z.object({
  filename: z.string(),
  mimetype: z.string(),
  size: z.number().int().positive(),
  serviceType: ServiceTypeEnum,
  taskId: z.number().int().positive().optional(),
  description: z.string().optional()
});

// Task filter input
export const taskFilterInput = z.object({
  serviceType: ServiceTypeEnum.optional(),
  status: z.enum(['pending', 'completed']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  minAmount: z.number().int().positive().optional(),
  maxAmount: z.number().int().positive().optional(),
  ...paginationInput.shape
});

// Worker filter input
export const workerFilterInput = z.object({
  minEarnings: z.number().int().nonnegative().optional(),
  minAccuracy: z.number().min(0).max(100).optional(),
  minTasksCompleted: z.number().int().nonnegative().optional(),
  ...paginationInput.shape
});

// Consensus calculation input
export const consensusCalculationInput = z.object({
  taskId: z.number().int().positive(),
  forceCalculation: z.boolean().optional().default(false)
});

// Reward distribution input
export const rewardDistributionInput = z.object({
  taskId: z.number().int().positive(),
  workerRewards: z.array(z.object({
    workerId: z.number().int().positive(),
    amount: z.number().int().positive(),
    rank: z.number().int().min(1).max(3)
  }))
});

// WebSocket message types
export const websocketMessageInput = z.object({
  type: z.enum(['task_update', 'worker_stats', 'system_stats', 'reward_notification']),
  data: z.any(),
  userId: z.number().int().positive().optional(),
  workerId: z.number().int().positive().optional()
});

// Admin operations input
export const adminOperationInput = z.object({
  operation: z.enum(['force_complete_task', 'recalculate_consensus', 'update_worker_stats', 'system_maintenance']),
  targetId: z.number().int().positive().optional(),
  parameters: z.record(z.any()).optional()
});

// Error response schema
export const errorResponseSchema = z.object({
  success: z.boolean().default(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.any().optional()
});

// Success response schema
export const successResponseSchema = z.object({
  success: z.boolean().default(true),
  data: z.any(),
  message: z.string().optional(),
  meta: z.object({
    timestamp: z.string().datetime(),
    requestId: z.string().optional()
  }).optional()
});

// Validation helper functions
export const validateServicePrice = (serviceType, reviewCount) => {
  const validCombinations = {
    'MARKETING_IMAGES': [200, 500],
    'YOUTUBE_THUMBNAILS': [200, 500],
    'VIDEOS': [100, 300]
  };
  
  return validCombinations[serviceType]?.includes(reviewCount) || false;
};

export const validateFileType = (serviceType, fileType) => {
  const validTypes = {
    'MARKETING_IMAGES': ['IMAGE'],
    'YOUTUBE_THUMBNAILS': ['IMAGE'],
    'VIDEOS': ['VIDEO']
  };
  
  return validTypes[serviceType]?.includes(fileType) || false;
};

// Custom validation middleware
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: result.error.format()
        });
      }
      req.validatedData = result.data;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Validation error",
        details: error.message
      });
    }
  };
};

// Query validation middleware
export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: "Query validation failed",
          details: result.error.format()
        });
      }
      req.validatedQuery = result.data;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Query validation error",
        details: error.message
      });
    }
  };
};