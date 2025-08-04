'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import {
  Upload,
  Users,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Star,
  ArrowRight,
  Play,
  Image as ImageIcon,
  Video,
  Zap,
  Shield,
  Globe,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
// import AnimatedCounter from '../components/AnimatedCounter';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Fetch system statistics
const fetchSystemStats = async () => {
  const response = await axios.get(`${API_BASE_URL}/v1/user/stats`);
  return response.data.data;
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

export default function HomePage() {
  const { connected, publicKey } = useWallet();
  const [selectedService, setSelectedService] = useState(null);

  // Fetch system statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['systemStats'],
    queryFn: fetchSystemStats,
    refetchInterval: 30000, // Refetch every 30 seconds
    onError: (error) => {
      console.error('Failed to fetch system stats:', error);
    }
  });

  const services = [
    {
      id: 'MARKETING_IMAGES',
      title: 'Marketing Images',
      description: 'Get your marketing visuals evaluated for maximum impact',
      icon: ImageIcon,
      color: 'from-blue-500 to-cyan-500',
      pricing: [
        { reviews: 200, price: '$25', popular: false },
        { reviews: 500, price: '$50', popular: true }
      ],
      features: ['Image optimization', 'A/B testing insights', 'Conversion analysis']
    },
    {
      id: 'YOUTUBE_THUMBNAILS',
      title: 'YouTube Thumbnails',
      description: 'Optimize your thumbnails for higher click-through rates',
      icon: Play,
      color: 'from-red-500 to-pink-500',
      pricing: [
        { reviews: 200, price: '$25', popular: false },
        { reviews: 500, price: '$50', popular: true }
      ],
      features: ['CTR optimization', 'Audience targeting', 'Trend analysis']
    },
    {
      id: 'VIDEOS',
      title: 'Video Content',
      description: 'Evaluate your video content for engagement potential',
      icon: Video,
      color: 'from-purple-500 to-indigo-500',
      pricing: [
        { reviews: 100, price: '$20', popular: false },
        { reviews: 300, price: '$50', popular: true }
      ],
      features: ['Engagement prediction', 'Content analysis', 'Audience feedback']
    }
  ];

  const features = [
    {
      icon: Users,
      title: 'Real Human Feedback',
      description: 'Get authentic evaluations from real people, not bots or algorithms.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast Results',
      description: 'Receive comprehensive feedback within hours, not days.'
    },
    {
      icon: Shield,
      title: 'Blockchain Secured',
      description: 'All transactions and data secured by Solana blockchain technology.'
    },
    {
      icon: Globe,
      title: 'Global Workforce',
      description: 'Access diverse perspectives from evaluators worldwide.'
    },
    {
      icon: TrendingUp,
      title: 'Actionable Insights',
      description: 'Get detailed analytics and recommendations for improvement.'
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Submit your content anytime and get results around the clock.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Marketing Director',
      company: 'TechStart Inc.',
      content: 'Previewer helped us increase our ad CTR by 340%. The insights are incredibly valuable.',
      avatar: '/avatars/sarah.jpg',
      rating: 5
    },
    {
      name: 'Mike Rodriguez',
      role: 'Content Creator',
      company: 'YouTube (2.1M subs)',
      content: 'My thumbnail performance improved dramatically. This platform is a game-changer.',
      avatar: '/avatars/mike.jpg',
      rating: 5
    },
    {
      name: 'Emma Thompson',
      role: 'Brand Manager',
      company: 'Fashion Forward',
      content: 'The quality of feedback is outstanding. Our conversion rates have never been better.',
      avatar: '/avatars/emma.jpg',
      rating: 5
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
              <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-2xl font-bold gradient-text">Previewer</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#how-it-works" className="text-gray-600 hover:text-primary-600 transition-colors">
                How it Works
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-primary-600 transition-colors">
                Pricing
              </a>
              <a href="#features" className="text-gray-600 hover:text-primary-600 transition-colors">
                Features
              </a>
              <Link href="/worker" className="text-gray-600 hover:text-primary-600 transition-colors">
                Become a Worker
              </Link>
            </div>

            {/* Wallet Connection */}
            <div className="flex items-center space-x-4">
              {connected && (
                <Link href="/dashboard" className="btn-outline">
                  Dashboard
                </Link>
              )}
              <WalletMultiButton className="!bg-primary-600 !rounded-lg" />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 overflow-hidden">
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
              Get Your Content{' '}
              <span className="gradient-text">Evaluated</span>
              <br />
              by Real People
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
              variants={fadeInUp}
            >
              Upload your marketing images, YouTube thumbnails, and videos to receive 
              authentic feedback from real humans. Optimize for maximum clickability 
              and engagement with blockchain-secured evaluations.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              variants={fadeInUp}
            >
              <Link href="/upload" className="btn-primary text-lg px-8 py-3">
                Start Evaluation
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <button className="btn-outline text-lg px-8 py-3">
                Watch Demo
                <Play className="ml-2 w-5 h-5" />
              </button>
            </motion.div>

            {/* Real-time Statistics */}
            {stats && (
              <motion.div 
                className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
                variants={fadeInUp}
              >
                <div className="stats-card">
                  <div className="stats-number text-primary-600">
                    {stats.totalWorkers?.toLocaleString() || '1,234'}
                  </div>
                  <div className="stats-label">Active Evaluators</div>
                </div>
                <div className="stats-card">
                  <div className="stats-number text-secondary-600">
                    {stats.totalTasksCompleted?.toLocaleString() || '89,012'}
                  </div>
                  <div className="stats-label">Tasks Completed</div>
                </div>
                <div className="stats-card">
                  <div className="stats-number text-success-600">
                    ${stats.totalEarningsPaidUSD?.toLocaleString() || '45,678'}
                  </div>
                  <div className="stats-label">Paid to Workers</div>
                </div>
                <div className="stats-card">
                  <div className="stats-number text-accent-600">
                    {stats.activeWorkers?.toLocaleString() || '567'}
                  </div>
                  <div className="stats-label">Online Now</div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Service
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Select the type of content you want to evaluate and get started with 
              professional feedback from our global community.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                className={`service-card ${selectedService === service.id ? 'service-card-selected' : ''}`}
                variants={scaleIn}
                onClick={() => setSelectedService(service.id)}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${service.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {service.title}
                </h3>
                
                <p className="text-gray-600 mb-6">
                  {service.description}
                </p>

                <div className="space-y-3 mb-6">
                  {service.pricing.map((plan, planIndex) => (
                    <div 
                      key={planIndex}
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        plan.popular ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'
                      }`}
                    >
                      <span className="font-medium">
                        {plan.reviews} reviews
                        {plan.popular && (
                          <span className="ml-2 badge-primary">Popular</span>
                        )}
                      </span>
                      <span className="font-bold text-lg">{plan.price}</span>
                    </div>
                  ))}
                </div>

                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-success-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link 
                  href={`/upload?service=${service.id}`}
                  className="btn-primary w-full justify-center"
                >
                  Get Started
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Previewer?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform combines human intelligence with blockchain technology 
              to deliver unparalleled content evaluation services.
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
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-primary-600" />
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
              Trusted by Creators Worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what our customers are saying about their experience with Previewer.
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
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Optimize Your Content?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of creators and marketers who trust Previewer 
              to maximize their content's impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/upload" className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200">
                Start Your First Evaluation
              </Link>
              <Link href="/worker" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium py-3 px-8 rounded-lg transition-all duration-200">
                Become an Evaluator
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
