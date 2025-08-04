'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Users,
  Clock,
  Star,
  ArrowRight,
  Play,
  CheckCircle,
  TrendingUp,
  Globe,
  Shield,
  Zap,
  Eye,
  ThumbsUp,
  Award,
  Timer,
  Coins
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedCounter from '../components/AnimatedCounter';
// import { useQuery } from '@tanstack/react-query';
// import axios from 'axios';
// import toast from 'react-hot-toast'; // Temporarily disabled
// import { format } from 'date-fns';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Temporary mock data for testing
const mockStats = {
  activeWorkers: 1234,
  totalEarningsPaidUSD: 45678,
  totalTasksCompleted: 89012
};

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5 }
};

export default function WorkerHomePage() {
  // Temporary wallet state - will be replaced with actual wallet integration later
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const router = useRouter();

  // Mock stats for testing
  const stats = mockStats;
  const statsLoading = false;

  // Temporary connect wallet function
  const handleConnectWallet = () => {
    alert('Wallet connection will be available soon!');
    // setConnected(true);
  };

  const earningPotential = [
    {
      type: 'Marketing Images',
      reward: '$0.059',
      description: 'Evaluate marketing visuals for clickability',
      timeEstimate: '30 seconds',
      icon: Eye,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      type: 'YouTube Thumbnails',
      reward: '$0.059',
      description: 'Rate thumbnails for click-through potential',
      timeEstimate: '30 seconds',
      icon: Play,
      color: 'from-red-500 to-pink-500'
    },
    {
      type: 'Video Content',
      reward: '$0.10',
      description: 'Watch and evaluate video engagement',
      timeEstimate: '2-3 minutes',
      icon: Play,
      color: 'from-purple-500 to-indigo-500'
    }
  ];

  const features = [
    {
      icon: DollarSign,
      title: 'Instant Payments',
      description: 'Get paid immediately in SOL after each completed evaluation.'
    },
    {
      icon: Clock,
      title: 'Flexible Schedule',
      description: 'Work whenever you want, from anywhere in the world.'
    },
    {
      icon: Shield,
      title: 'Blockchain Secured',
      description: 'All payments secured by Solana blockchain technology.'
    },
    {
      icon: Globe,
      title: 'Global Community',
      description: 'Join workers from around the world in our growing network.'
    },
    {
      icon: TrendingUp,
      title: 'Growing Demand',
      description: 'More creators joining daily means more earning opportunities.'
    },
    {
      icon: Zap,
      title: 'Quick Tasks',
      description: 'Most evaluations take less than a minute to complete.'
    }
  ];

  const testimonials = [
    {
      name: 'Alex Chen',
      location: 'Singapore',
      earnings: '$2,340',
      period: 'Last 30 days',
      content: 'Perfect side income! I evaluate content during my commute and earn extra SOL.',
      avatar: '/avatars/alex.jpg',
      rating: 5
    },
    {
      name: 'Maria Rodriguez',
      location: 'Mexico City',
      earnings: '$1,890',
      period: 'Last 30 days',
      content: 'Great way to earn crypto. The tasks are interesting and payments are instant.',
      avatar: '/avatars/maria.jpg',
      rating: 5
    },
    {
      name: 'David Kim',
      location: 'Seoul',
      earnings: '$3,120',
      period: 'Last 30 days',
      content: 'Been working here for 6 months. Consistent income and fair evaluation system.',
      avatar: '/avatars/david.jpg',
      rating: 5
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Connect Wallet',
      description: 'Connect your Solana wallet to get started',
      icon: Shield
    },
    {
      step: 2,
      title: 'Get Tasks',
      description: 'Receive content evaluation tasks instantly',
      icon: Eye
    },
    {
      step: 3,
      title: 'Evaluate Content',
      description: 'Rate images, thumbnails, or videos for clickability',
      icon: ThumbsUp
    },
    {
      step: 4,
      title: 'Earn SOL',
      description: 'Get paid immediately after each completed task',
      icon: Coins
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-secondary-600 to-accent-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-secondary-600 to-accent-600 bg-clip-text text-transparent">
                Previewer Workers
              </span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#how-it-works" className="text-gray-600 hover:text-secondary-600 transition-colors">
                How it Works
              </a>
              <a href="#earnings" className="text-gray-600 hover:text-secondary-600 transition-colors">
                Earnings
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-secondary-600 transition-colors">
                Success Stories
              </a>
              <Link href="/" className="text-gray-600 hover:text-secondary-600 transition-colors">
                For Creators
              </Link>
            </div>

            {/* Wallet Connection */}
            <div className="flex items-center space-x-4">
              {connected && (
                <Link href="/dashboard" className="btn-outline">
                  Dashboard
                </Link>
              )}
              <button 
                onClick={handleConnectWallet}
                className="bg-secondary-600 hover:bg-secondary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-secondary-50 via-white to-accent-50 py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hero-pattern opacity-30"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
              variants={fadeInUp}
            >
              Earn{' '}
              <span className="bg-gradient-to-r from-secondary-600 to-accent-600 bg-clip-text text-transparent">
                Cryptocurrency
              </span>
              <br />
              by Evaluating Content
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
              variants={fadeInUp}
            >
              Join thousands of workers earning Solana by providing feedback on marketing 
              images, YouTube thumbnails, and videos. Work from anywhere, anytime.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              variants={fadeInUp}
            >
              <button 
                onClick={handleConnectWallet}
                className="bg-secondary-600 hover:bg-secondary-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 text-lg"
              >
                Start Earning Now
                <ArrowRight className="ml-2 w-5 h-5 inline" />
              </button>
              <button className="border-2 border-secondary-600 text-secondary-600 hover:bg-secondary-600 hover:text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 text-lg">
                Watch Demo
                <Play className="ml-2 w-5 h-5 inline" />
              </button>
            </motion.div>

            {/* Real-time Statistics */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
              variants={fadeInUp}
            >
              <div className="stats-card">
                <div className="stats-number text-secondary-600">
                  <AnimatedCounter
                    end={stats?.activeWorkers || 1234}
                    duration={2.5}
                    separator=","
                  />
                </div>
                <div className="stats-label">Active Workers</div>
              </div>
              <div className="stats-card">
                <div className="stats-number text-success-600">
                  <AnimatedCounter
                    end={stats?.totalEarningsPaidUSD || 45678}
                    duration={3}
                    prefix="$"
                    separator=","
                  />
                </div>
                <div className="stats-label">Total Paid Out</div>
              </div>
              <div className="stats-card">
                <div className="stats-number text-accent-600">
                  <AnimatedCounter
                    end={stats?.totalTasksCompleted || 89012}
                    duration={2.8}
                    separator=","
                  />
                </div>
                <div className="stats-label">Tasks Completed</div>
              </div>
              <div className="stats-card">
                <div className="stats-number text-primary-600">
                  24/7
                </div>
                <div className="stats-label">Always Available</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start earning cryptocurrency in just 4 simple steps
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.step}
                className="text-center"
                variants={scaleIn}
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-secondary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Earnings Potential Section */}
      <section id="earnings" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Earning Potential
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how much you can earn with different types of evaluation tasks
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {earningPotential.map((earning, index) => (
              <motion.div
                key={earning.type}
                className="card hover-lift text-center"
                variants={scaleIn}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${earning.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                  <earning.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {earning.type}
                </h3>
                
                <div className="text-3xl font-bold text-secondary-600 mb-2">
                  {earning.reward}
                </div>
                
                <p className="text-gray-600 mb-4">
                  {earning.description}
                </p>
                
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <Timer className="w-4 h-4 mr-1" />
                  {earning.timeEstimate}
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-12 text-center"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className="inline-flex items-center p-4 bg-secondary-50 border border-secondary-200 rounded-lg">
              <Zap className="w-6 h-6 text-secondary-600 mr-3" />
              <div className="text-left">
                <div className="font-semibold text-secondary-900">
                  Potential Daily Earnings: $50-200+
                </div>
                <div className="text-sm text-secondary-600">
                  Based on completing 100-500 tasks per day
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Work With Us?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join the future of work with blockchain-powered micro-tasks
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="card text-center hover-lift"
                variants={scaleIn}
              >
                <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-secondary-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what our top workers are saying about their experience
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="card hover-lift"
                variants={scaleIn}
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-secondary-400 to-accent-400 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {testimonial.location}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-secondary-600">
                      {testimonial.earnings}
                    </div>
                    <div className="text-xs text-gray-500">
                      {testimonial.period}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-secondary-600 to-accent-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Start Earning?
            </h2>
            <p className="text-xl text-secondary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of workers already earning cryptocurrency by evaluating content. 
              Connect your wallet and start your first task today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleConnectWallet}
                className="bg-white text-secondary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Connect Wallet & Start
              </button>
              <button className="border-2 border-white text-white hover:bg-white hover:text-secondary-600 font-medium py-3 px-8 rounded-lg transition-all duration-200">
                Learn More
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
