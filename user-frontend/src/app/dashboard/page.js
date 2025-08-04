'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Eye, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  DollarSign,
  Users,
  BarChart3,
  Filter,
  Search,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Fetch user profile and statistics
const fetchUserProfile = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/v1/user/profile`, {
    headers: { Authorization: token }
  });
  return response.data.data;
};

// Fetch user tasks
const fetchUserTasks = async (token, filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axios.get(`${API_BASE_URL}/v1/user/tasks?${params}`, {
    headers: { Authorization: token }
  });
  return response.data.data;
};

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [authToken, setAuthToken] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    serviceType: '',
    page: 1,
    limit: 10
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('authToken');
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

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', authToken],
    queryFn: () => fetchUserProfile(authToken),
    enabled: !!authToken,
    onError: (error) => {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    }
  });

  // Fetch user tasks
  const { data: tasksData, isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['userTasks', authToken, filters],
    queryFn: () => fetchUserTasks(authToken, filters),
    enabled: !!authToken,
    onError: (error) => {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to load tasks');
    }
  });

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page
    }));
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    refetchTasks();
  };

  // Refresh data
  const handleRefresh = () => {
    queryClient.invalidateQueries(['userProfile']);
    queryClient.invalidateQueries(['userTasks']);
    toast.success('Data refreshed');
  };

  // Get status color
  const getStatusColor = (task) => {
    if (task.done) return 'text-success-600 bg-success-100';
    if (task.progress.percentage >= 80) return 'text-warning-600 bg-warning-100';
    return 'text-primary-600 bg-primary-100';
  };

  // Get status text
  const getStatusText = (task) => {
    if (task.done) return 'Completed';
    if (task.progress.percentage >= 80) return 'Nearly Complete';
    return 'In Progress';
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!tasksData?.tasks) return { barData: [], pieData: [] };

    const serviceTypes = tasksData.tasks.reduce((acc, task) => {
      const type = task.serviceType.replace('_', ' ');
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const barData = Object.entries(serviceTypes).map(([name, value]) => ({
      name,
      tasks: value
    }));

    const statusData = tasksData.tasks.reduce((acc, task) => {
      const status = task.done ? 'Completed' : 'In Progress';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const pieData = Object.entries(statusData).map(([name, value]) => ({
      name,
      value
    }));

    return { barData, pieData };
  };

  const { barData, pieData } = prepareChartData();
  const COLORS = ['#0ea5e9', '#d946ef', '#f97316', '#22c55e'];

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to access your dashboard
          </p>
          <WalletMultiButton />
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
              <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-2xl font-bold gradient-text">Previewer</span>
            </Link>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              <Link href="/upload" className="btn-primary">
                <Plus className="w-5 h-5 mr-2" />
                New Task
              </Link>
              
              <WalletMultiButton className="!bg-gray-100 !text-gray-900" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back!
          </h1>
          <p className="text-gray-600">
            Manage your content evaluations and track performance
          </p>
        </div>

        {/* Statistics Cards */}
        {profile && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              className="stats-card hover-lift"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="stats-number text-primary-600">
                {profile.statistics.totalTasks}
              </div>
              <div className="stats-label">Total Tasks</div>
            </motion.div>

            <motion.div
              className="stats-card hover-lift"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="stats-number text-success-600">
                {profile.statistics.completedTasks}
              </div>
              <div className="stats-label">Completed</div>
            </motion.div>

            <motion.div
              className="stats-card hover-lift"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="stats-number text-warning-600">
                {profile.statistics.pendingTasks}
              </div>
              <div className="stats-label">In Progress</div>
            </motion.div>

            <motion.div
              className="stats-card hover-lift"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="stats-number text-secondary-600">
                ${profile.statistics.totalSpentUSD?.toFixed(2) || '0.00'}
              </div>
              <div className="stats-label">Total Spent</div>
            </motion.div>
          </div>
        )}

        {/* Charts Section */}
        {tasksData?.tasks && tasksData.tasks.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Bar Chart */}
            <motion.div
              className="card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Tasks by Service Type
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Pie Chart */}
            <motion.div
              className="card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Task Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-primary pl-10"
                />
              </div>
            </form>

            {/* Filters */}
            <div className="flex gap-4">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-primary"
              >
                <option value="all">All Status</option>
                <option value="pending">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={filters.serviceType}
                onChange={(e) => handleFilterChange('serviceType', e.target.value)}
                className="input-primary"
              >
                <option value="">All Services</option>
                <option value="MARKETING_IMAGES">Marketing Images</option>
                <option value="YOUTUBE_THUMBNAILS">YouTube Thumbnails</option>
                <option value="VIDEOS">Videos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Your Tasks</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {tasksData?.pagination.total || 0} total tasks
              </span>
            </div>
          </div>

          {tasksLoading ? (
            <div className="text-center py-8">
              <div className="spinner w-8 h-8 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tasks...</p>
            </div>
          ) : tasksData?.tasks && tasksData.tasks.length > 0 ? (
            <div className="space-y-4">
              {tasksData.tasks.map((task) => (
                <motion.div
                  key={task.id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {task.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(task.createdAt), 'MMM dd, yyyy')}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {task.reviewCount} reviews
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          ${(task.amount / 1000000000 * 100).toFixed(2)} {/* Convert from lamports */}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`badge ${getStatusColor(task)}`}>
                        {getStatusText(task)}
                      </span>
                      
                      <Link
                        href={`/dashboard/task/${task.id}`}
                        className="btn-outline btn-sm"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{task.progress.completed}/{task.progress.required} reviews</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${Math.min(task.progress.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Service Type and Options */}
                  <div className="flex items-center justify-between">
                    <span className="badge-gray">
                      {task.serviceType.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-600">
                      {task.options?.length || 0} files uploaded
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* Pagination */}
              {tasksData.pagination.pages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex space-x-2">
                    {Array.from({ length: tasksData.pagination.pages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handleFilterChange('page', page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filters.page === page
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tasks found
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first content evaluation task
              </p>
              <Link href="/upload" className="btn-primary">
                <Plus className="w-5 h-5 mr-2" />
                Create Task
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}