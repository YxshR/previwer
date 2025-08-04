'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion, AnimatePresence } from 'framer-motion';
import WalletConnectionModal from '../../components/WalletConnectionModal';
import {
  DollarSign,
  Eye,
  Clock,
  CheckCircle,
  TrendingUp,
  Users,
  Star,
  Play,
  Pause,
  SkipForward,
  ThumbsUp,
  ThumbsDown,
  Award,
  Coins,
  ArrowUpRight,
  RefreshCw,
  History,
  Settings,
  LogOut,
  Timer,
  Target,
  Zap,
  Wallet
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Countdown from 'react-countdown';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Fetch worker profile and statistics
const fetchWorkerProfile = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/v1/worker/profile`, {
    headers: { Authorization: token }
  });
  return response.data.data;
};

// Fetch worker balance
const fetchWorkerBalance = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/v1/worker/balance`, {
    headers: { Authorization: token }
  });
  return response.data.data;
};

// Fetch next task
const fetchNextTask = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/v1/worker/nextTask`, {
    headers: { Authorization: token }
  });
  return response.data.data;
};

// Submit task evaluation
const submitEvaluation = async ({ token, taskId, selection }) => {
  const response = await axios.post(
    `${API_BASE_URL}/v1/worker/submission`,
    { taskId: taskId.toString(), selection: selection.toString() },
    { headers: { Authorization: token } }
  );
  return response.data.data;
};

// Request payout
const requestPayout = async ({ token, amount }) => {
  const response = await axios.post(
    `${API_BASE_URL}/v1/worker/payout`,
    amount ? { amount } : {},
    { headers: { Authorization: token } }
  );
  return response.data.data;
};

export default function WorkerDashboardPage() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [authToken, setAuthToken] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [taskStartTime, setTaskStartTime] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('workerAuthToken');
    if (!token && connected) {
      // Redirect to authentication or show connect wallet
      toast.error('Please authenticate your wallet');
      return;
    }
    setAuthToken(token);
  }, [connected]);

  // Redirect if not connected
  useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

  // Fetch worker profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['workerProfile', authToken],
    queryFn: () => fetchWorkerProfile(authToken),
    enabled: !!authToken,
    onError: (error) => {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    }
  });

  // Fetch worker balance
  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['workerBalance', authToken],
    queryFn: () => fetchWorkerBalance(authToken),
    enabled: !!authToken,
    refetchInterval: 10000, // Refetch every 10 seconds
    onError: (error) => {
      console.error('Failed to fetch balance:', error);
    }
  });

  // Fetch next task
  const { data: nextTaskData, isLoading: taskLoading, refetch: refetchTask } = useQuery({
    queryKey: ['nextTask', authToken],
    queryFn: () => fetchNextTask(authToken),
    enabled: !!authToken,
    onSuccess: (data) => {
      if (data?.task) {
        setCurrentTask(data.task);
        setSelectedOption(null);
        setTaskStartTime(Date.now());
        setVideoWatched(false);
        setVideoPlaying(false);
      } else {
        setCurrentTask(null);
      }
    },
    onError: (error) => {
      console.error('Failed to fetch next task:', error);
    }
  });

  // Submit evaluation mutation
  const submitEvaluationMutation = useMutation(submitEvaluation, {
    onSuccess: (data) => {
      toast.success(`Task completed! Earned ${(data.amount / 1000000000).toFixed(6)} SOL`);
      
      // Update balance
      queryClient.invalidateQueries(['workerBalance']);
      
      // Load next task
      if (data.nextTask) {
        setCurrentTask(data.nextTask);
        setSelectedOption(null);
        setTaskStartTime(Date.now());
        setVideoWatched(false);
        setVideoPlaying(false);
      } else {
        setCurrentTask(null);
        toast.info('No more tasks available right now. Check back soon!');
      }
      
      setIsEvaluating(false);
    },
    onError: (error) => {
      console.error('Failed to submit evaluation:', error);
      toast.error(error.response?.data?.error || 'Failed to submit evaluation');
      setIsEvaluating(false);
    }
  });

  // Payout mutation
  const payoutMutation = useMutation(requestPayout, {
    onSuccess: (data) => {
      toast.success(`Payout successful! ${data.withdrawal.amountSOL} SOL sent to your wallet`);
      queryClient.invalidateQueries(['workerBalance']);
      setShowEarningsModal(false);
    },
    onError: (error) => {
      console.error('Payout failed:', error);
      toast.error(error.response?.data?.error || 'Payout failed');
    }
  });

  // Handle task submission
  const handleSubmitEvaluation = async () => {
    if (!selectedOption || !currentTask) {
      toast.error('Please select an option');
      return;
    }

    // Check if video task requires watching
    if (currentTask.serviceType === 'VIDEOS' && !videoWatched) {
      toast.error('Please watch the video before submitting');
      return;
    }

    setIsEvaluating(true);
    
    submitEvaluationMutation.mutate({
      token: authToken,
      taskId: currentTask.id,
      selection: selectedOption
    });
  };

  // Handle video play/pause
  const handleVideoToggle = () => {
    setVideoPlaying(!videoPlaying);
    if (!videoPlaying) {
      // Start watching timer
      setTimeout(() => {
        setVideoWatched(true);
      }, 5000); // Minimum 5 seconds
    }
  };

  // Handle payout request
  const handlePayout = () => {
    if (!balance?.balance.pending.lamports || balance.balance.pending.lamports === 0) {
      toast.error('No pending balance to withdraw');
      return;
    }

    payoutMutation.mutate({
      token: authToken
    });
  };

  // Refresh data
  const handleRefresh = () => {
    queryClient.invalidateQueries(['workerProfile']);
    queryClient.invalidateQueries(['workerBalance']);
    refetchTask();
    toast.success('Data refreshed');
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-20 h-20 bg-gradient-to-r from-secondary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Worker Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            Connect your wallet to access your worker dashboard and start earning SOL by evaluating content.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => setShowWalletModal(true)}
              className="w-full bg-secondary-600 hover:bg-secondary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Connect Wallet
            </button>
            <p className="text-sm text-gray-500">
              Wallet connection will be available soon! Click above to learn more.
            </p>
          </div>
          
          {/* Wallet Connection Modal */}
          <WalletConnectionModal
            isOpen={showWalletModal}
            onClose={() => setShowWalletModal(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-secondary-600 to-accent-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-secondary-600 to-accent-600 bg-clip-text text-transparent">
                Previewer Workers
              </span>
            </Link>

            {/* Real-time Earnings Display */}
            {balance && (
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className="text-sm text-gray-600">Pending Earnings</div>
                  <div className="text-lg font-bold text-secondary-600">
                    ${balance.balance.pending.usd?.toFixed(2) || '0.00'}
                  </div>
                </div>
                
                <button
                  onClick={() => setShowEarningsModal(true)}
                  className="bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Coins className="w-4 h-4 mr-2 inline" />
                  Withdraw
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              <WalletMultiButton className="!bg-gray-100 !text-gray-900" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Task Area */}
          <div className="lg:col-span-2">
            {currentTask ? (
              <motion.div
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentTask.title}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {currentTask.progress.completed}/{currentTask.progress.required} reviews
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Up to ${(currentTask.estimatedReward.first / 1000000000 * 100).toFixed(3)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Progress</div>
                    <div className="text-lg font-bold text-primary-600">
                      {currentTask.progress.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Task Instructions */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
                  <p className="text-blue-800 text-sm">
                    {currentTask.serviceType === 'VIDEOS' 
                      ? 'Watch the video content and select the option you think would get the most engagement and clicks.'
                      : 'Look at each option and select the one you think would get the most clicks if used in marketing.'
                    }
                  </p>
                  {currentTask.serviceType === 'VIDEOS' && (
                    <p className="text-blue-700 text-xs mt-2">
                      ⚠️ You must watch the video for at least 5 seconds before submitting.
                    </p>
                  )}
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {currentTask.options.map((option, index) => (
                    <motion.div
                      key={option.id}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedOption === option.id
                          ? 'border-secondary-500 ring-2 ring-secondary-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedOption(option.id)}
                    >
                      {option.file_type === 'IMAGE' ? (
                        <img
                          src={option.image_url || option.ipfs_hash}
                          alt={`Option ${index + 1}`}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="relative">
                          <video
                            src={option.video_url || option.ipfs_hash}
                            className="w-full h-48 object-cover"
                            controls={false}
                            muted
                            loop
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVideoToggle();
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <button
                              className="bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVideoToggle();
                              }}
                            >
                              {videoPlaying ? (
                                <Pause className="w-6 h-6" />
                              ) : (
                                <Play className="w-6 h-6" />
                              )}
                            </button>
                          </div>
                          {videoWatched && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle className="w-6 h-6 text-green-500" />
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">
                            Option {index + 1}
                          </span>
                          {selectedOption === option.id && (
                            <CheckCircle className="w-5 h-5 text-secondary-600" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Submit Button */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {taskStartTime && (
                      <span>
                        Time elapsed: <Countdown date={taskStartTime + 300000} renderer={({ minutes, seconds }) => `${minutes}:${seconds.toString().padStart(2, '0')}`} />
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={handleSubmitEvaluation}
                    disabled={!selectedOption || isEvaluating || (currentTask.serviceType === 'VIDEOS' && !videoWatched)}
                    className="bg-secondary-600 hover:bg-secondary-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                  >
                    {isEvaluating ? (
                      <>
                        <div className="spinner w-4 h-4 mr-2 inline-block"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Evaluation
                        <ArrowUpRight className="w-4 h-4 ml-2 inline" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="card text-center py-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Tasks Available
                </h3>
                <p className="text-gray-600 mb-6">
                  All current tasks have been completed. New tasks will appear here automatically.
                </p>
                <button
                  onClick={refetchTask}
                  className="btn-outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check for New Tasks
                </button>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Worker Stats */}
            {profile && (
              <motion.div
                className="card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Performance
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tasks Completed</span>
                    <span className="font-medium">{profile.statistics.tasksCompleted}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Accuracy Score</span>
                    <span className="font-medium text-success-600">
                      {profile.statistics.accuracy.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Earned</span>
                    <span className="font-medium text-secondary-600">
                      ${(profile.statistics.totalEarned / 1000000000 * 100).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Worker Level</span>
                      <span className="badge-secondary">
                        {profile.statistics.tasksCompleted < 10 ? 'Beginner' :
                         profile.statistics.tasksCompleted < 100 ? 'Intermediate' :
                         profile.statistics.tasksCompleted < 500 ? 'Advanced' : 'Expert'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Balance Overview */}
            {balance && (
              <motion.div
                className="card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Earnings Overview
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Pending Balance</div>
                    <div className="text-2xl font-bold text-secondary-600">
                      ${balance.balance.pending.usd?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {balance.balance.pending.sol?.toFixed(6) || '0.000000'} SOL
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Earned</div>
                    <div className="text-lg font-semibold text-gray-900">
                      ${balance.balance.totalEarned.usd?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowEarningsModal(true)}
                    disabled={!balance.balance.pending.lamports || balance.balance.pending.lamports === 0}
                    className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Withdraw Earnings
                  </button>
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              className="card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                <Link href="/dashboard/history" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <History className="w-5 h-5 text-gray-400 mr-3" />
                  <span>View History</span>
                </Link>
                
                <Link href="/dashboard/stats" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <TrendingUp className="w-5 h-5 text-gray-400 mr-3" />
                  <span>Detailed Stats</span>
                </Link>
                
                <Link href="/dashboard/settings" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Settings className="w-5 h-5 text-gray-400 mr-3" />
                  <span>Settings</span>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Earnings Modal */}
      <AnimatePresence>
        {showEarningsModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEarningsModal(false)}
          >
            <motion.div
              className="bg-white rounded-xl p-6 max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Withdraw Earnings
              </h3>
              
              {balance && (
                <div className="space-y-4">
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <div className="text-sm text-secondary-600 mb-1">Available to Withdraw</div>
                    <div className="text-2xl font-bold text-secondary-600">
                      ${balance.balance.pending.usd?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-sm text-secondary-500">
                      {balance.balance.pending.sol?.toFixed(6) || '0.000000'} SOL
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">
                      Funds will be sent directly to your connected wallet address:
                    </p>
                    <p className="font-mono text-xs bg-gray-100 p-2 rounded">
                      {publicKey?.toString()}
                    </p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowEarningsModal(false)}
                      className="btn-ghost flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePayout}
                      disabled={payoutMutation.isLoading || !balance.balance.pending.lamports}
                      className="btn-secondary flex-1"
                    >
                      {payoutMutation.isLoading ? (
                        <>
                          <div className="spinner w-4 h-4 mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        'Withdraw All'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet Connection Modal */}
      <WalletConnectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </div>
  );
}