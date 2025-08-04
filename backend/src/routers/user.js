import jwt from "jsonwebtoken";
import { Router } from "express";
import { prismaClient, getUserTaskHistory } from "../db.js";
import { authMiddleware } from "../middleware.js";
import { 
  createTaskInput, 
  userSigninInput, 
  fileUploadInput,
  paymentVerificationInput,
  taskQueryInput,
  userTaskHistoryInput,
  validateRequest,
  validateQuery
} from "../types.js";
import solanaService from "../services/solana.js";
import ipfsService from "../services/ipfs.js";
import consensusService from "../services/consensus.js";
import cloudinary from "cloudinary";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
    files: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 5
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

/**
 * User authentication with wallet signature
 */
router.post("/signin", validateRequest(userSigninInput), async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.validatedData;

    // Validate wallet address format
    if (!solanaService.isValidWalletAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: "Invalid wallet address format"
      });
    }

    // Find or create user
    let user = await prismaClient.user.findFirst({
      where: { address: walletAddress }
    });

    if (!user) {
      user = await prismaClient.user.create({
        data: { address: walletAddress }
      });
    }

    // Create session token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store session in database
    await prismaClient.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          address: user.address,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('User signin error:', error);
    res.status(500).json({
      success: false,
      error: "Authentication failed"
    });
  }
});

/**
 * Get user profile and statistics
 */
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      include: {
        tasks: {
          select: {
            id: true,
            serviceType: true,
            amount: true,
            done: true,
            createdAt: true,
            completedAt: true,
            _count: {
              select: {
                submissions: true
              }
            }
          }
        },
        payouts: {
          select: {
            amount: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Calculate user statistics
    const totalSpent = user.tasks.reduce((sum, task) => sum + task.amount, 0);
    const completedTasks = user.tasks.filter(task => task.done).length;
    const pendingTasks = user.tasks.filter(task => !task.done).length;

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          address: user.address,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        statistics: {
          totalTasks: user.tasks.length,
          completedTasks,
          pendingTasks,
          totalSpent,
          totalSpentUSD: await solanaService.lamportsToUsd(totalSpent)
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch profile"
    });
  }
});

/**
 * Upload files and create task
 */
router.post("/upload", authMiddleware, upload.array('files', 5), async (req, res) => {
  try {
    const userId = req.userId;
    const { serviceType, reviewCount, signature } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No files uploaded"
      });
    }

    // Validate service type and review count combination
    const expectedAmount = solanaService.getServicePrice(serviceType, parseInt(reviewCount));
    if (!expectedAmount) {
      return res.status(400).json({
        success: false,
        error: "Invalid service type and review count combination"
      });
    }

    // Verify payment
    const user = await prismaClient.user.findUnique({ where: { id: userId } });
    const paymentValid = await solanaService.verifyPayment(signature, expectedAmount, user.address);
    
    if (!paymentValid) {
      return res.status(400).json({
        success: false,
        error: "Payment verification failed"
      });
    }

    // Upload files to IPFS and Cloudinary
    const uploadPromises = req.files.map(async (file) => {
      const fileType = file.mimetype.startsWith('image/') ? 'IMAGE' : 'VIDEO';
      
      // Upload to IPFS
      const ipfsResult = await ipfsService.uploadWithMetadata(file.buffer, {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        serviceType,
        fileType
      });

      // Upload to Cloudinary as backup
      const cloudinaryResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          {
            resource_type: fileType === 'IMAGE' ? 'image' : 'video',
            folder: `previewer/${serviceType.toLowerCase()}`,
            public_id: uuidv4()
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      return {
        ipfsHash: ipfsResult.fileHash,
        ipfsUrl: ipfsResult.fileUrl,
        cloudinaryUrl: cloudinaryResult.secure_url,
        fileType,
        filename: file.originalname,
        size: file.size
      };
    });

    const uploadResults = await Promise.all(uploadPromises);

    // Create task in database
    const task = await prismaClient.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          title: `${serviceType.replace('_', ' ')} Evaluation`,
          serviceType,
          reviewCount: parseInt(reviewCount),
          user_id: userId,
          signature,
          amount: expectedAmount
        }
      });

      // Create options for each uploaded file
      const options = await Promise.all(
        uploadResults.map(result => 
          tx.option.create({
            data: {
              task_id: newTask.id,
              image_url: result.fileType === 'IMAGE' ? result.cloudinaryUrl : null,
              video_url: result.fileType === 'VIDEO' ? result.cloudinaryUrl : null,
              ipfs_hash: result.ipfsHash,
              file_type: result.fileType
            }
          })
        )
      );

      return { ...newTask, options };
    });

    res.json({
      success: true,
      data: {
        taskId: task.id,
        uploadResults,
        task: {
          id: task.id,
          serviceType: task.serviceType,
          reviewCount: task.reviewCount,
          amount: task.amount,
          createdAt: task.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: "Upload failed",
      details: error.message
    });
  }
});

/**
 * Get task details and results
 */
router.get("/task", authMiddleware, validateQuery(taskQueryInput), async (req, res) => {
  try {
    const { taskId, includeResults } = req.validatedQuery;
    const userId = req.userId;

    const task = await prismaClient.task.findFirst({
      where: {
        id: taskId,
        user_id: userId
      },
      include: {
        options: {
          select: {
            id: true,
            image_url: true,
            video_url: true,
            ipfs_hash: true,
            file_type: true
          }
        },
        submissions: {
          select: {
            id: true,
            option_id: true,
            createdAt: true,
            worker: {
              select: {
                id: true,
                address: true
              }
            }
          }
        },
        ...(includeResults && {
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
        })
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found or access denied"
      });
    }

    // Calculate submission statistics
    const submissionStats = {};
    task.options.forEach(option => {
      submissionStats[option.id] = {
        count: 0,
        percentage: 0,
        option: {
          id: option.id,
          imageUrl: option.image_url,
          videoUrl: option.video_url,
          ipfsHash: option.ipfs_hash,
          fileType: option.file_type
        }
      };
    });

    task.submissions.forEach(submission => {
      if (submissionStats[submission.option_id]) {
        submissionStats[submission.option_id].count++;
      }
    });

    // Calculate percentages
    const totalSubmissions = task.submissions.length;
    Object.values(submissionStats).forEach(stat => {
      stat.percentage = totalSubmissions > 0 ? (stat.count / totalSubmissions) * 100 : 0;
    });

    const response = {
      success: true,
      data: {
        task: {
          id: task.id,
          title: task.title,
          serviceType: task.serviceType,
          reviewCount: task.reviewCount,
          amount: task.amount,
          done: task.done,
          createdAt: task.createdAt,
          completedAt: task.completedAt,
          progress: {
            completed: totalSubmissions,
            required: task.reviewCount,
            percentage: (totalSubmissions / task.reviewCount) * 100
          }
        },
        options: task.options,
        submissionStats,
        ...(includeResults && task.results.length > 0 && {
          results: task.results[0].results
        })
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch task"
    });
  }
});

/**
 * Get user's task history
 */
router.get("/tasks", authMiddleware, validateQuery(userTaskHistoryInput), async (req, res) => {
  try {
    const userId = req.userId;
    const queryOptions = req.validatedQuery;

    const { tasks, pagination } = await getUserTaskHistory(userId, queryOptions);

    // Add progress information to each task
    const tasksWithProgress = tasks.map(task => ({
      ...task,
      progress: {
        completed: task.submissions.length,
        required: task.reviewCount,
        percentage: (task.submissions.length / task.reviewCount) * 100
      },
      hasResults: task.results.length > 0
    }));

    res.json({
      success: true,
      data: {
        tasks: tasksWithProgress,
        pagination
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tasks"
    });
  }
});

/**
 * Get service pricing information
 */
router.get("/pricing", async (req, res) => {
  try {
    const solPrice = await solanaService.getSolPrice();
    
    const pricing = {
      MARKETING_IMAGES: {
        200: {
          lamports: solanaService.getServicePrice('MARKETING_IMAGES', 200),
          sol: solanaService.getServicePrice('MARKETING_IMAGES', 200) / 1000000000,
          usd: await solanaService.lamportsToUsd(solanaService.getServicePrice('MARKETING_IMAGES', 200))
        },
        500: {
          lamports: solanaService.getServicePrice('MARKETING_IMAGES', 500),
          sol: solanaService.getServicePrice('MARKETING_IMAGES', 500) / 1000000000,
          usd: await solanaService.lamportsToUsd(solanaService.getServicePrice('MARKETING_IMAGES', 500))
        }
      },
      YOUTUBE_THUMBNAILS: {
        200: {
          lamports: solanaService.getServicePrice('YOUTUBE_THUMBNAILS', 200),
          sol: solanaService.getServicePrice('YOUTUBE_THUMBNAILS', 200) / 1000000000,
          usd: await solanaService.lamportsToUsd(solanaService.getServicePrice('YOUTUBE_THUMBNAILS', 200))
        },
        500: {
          lamports: solanaService.getServicePrice('YOUTUBE_THUMBNAILS', 500),
          sol: solanaService.getServicePrice('YOUTUBE_THUMBNAILS', 500) / 1000000000,
          usd: await solanaService.lamportsToUsd(solanaService.getServicePrice('YOUTUBE_THUMBNAILS', 500))
        }
      },
      VIDEOS: {
        100: {
          lamports: solanaService.getServicePrice('VIDEOS', 100),
          sol: solanaService.getServicePrice('VIDEOS', 100) / 1000000000,
          usd: await solanaService.lamportsToUsd(solanaService.getServicePrice('VIDEOS', 100))
        },
        300: {
          lamports: solanaService.getServicePrice('VIDEOS', 300),
          sol: solanaService.getServicePrice('VIDEOS', 300) / 1000000000,
          usd: await solanaService.lamportsToUsd(solanaService.getServicePrice('VIDEOS', 300))
        }
      }
    };

    res.json({
      success: true,
      data: {
        pricing,
        solPrice,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get pricing error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch pricing"
    });
  }
});

/**
 * Get system statistics for landing page
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await prismaClient.systemStats.findFirst();
    
    if (!stats) {
      return res.json({
        success: true,
        data: {
          totalWorkers: 0,
          activeWorkers: 0,
          totalTasksCompleted: 0,
          totalEarningsPaid: 0,
          totalEarningsPaidUSD: 0
        }
      });
    }

    const totalEarningsPaidUSD = await solanaService.lamportsToUsd(stats.total_earnings_paid);

    res.json({
      success: true,
      data: {
        totalWorkers: stats.total_workers,
        activeWorkers: stats.active_workers,
        totalTasksCompleted: stats.total_tasks_completed,
        totalEarningsPaid: stats.total_earnings_paid,
        totalEarningsPaidUSD,
        lastUpdated: stats.updatedAt
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics"
    });
  }
});

/**
 * Get signed URL for direct file upload (legacy support)
 */
router.get("/signedUrl", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const uniqueName = uuidv4();
    const folder = `user_uploads/${userId}`;
    const publicId = `${folder}/${uniqueName}`;
    const timestamp = Math.floor(Date.now() / 1000);

    const signature = cloudinary.v2.utils.api_sign_request(
      {
        timestamp,
        public_id: publicId,
      },
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      success: true,
      data: {
        upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
        timestamp,
        signature,
        public_id: publicId,
        api_key: process.env.CLOUDINARY_API_KEY,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      }
    });
  } catch (error) {
    console.error('Get signed URL error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to generate signed URL"
    });
  }
});

export default router;