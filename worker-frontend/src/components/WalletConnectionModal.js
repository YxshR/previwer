'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Wallet, 
  Clock, 
  Bell, 
  CheckCircle, 
  ArrowRight,
  Shield,
  Zap
} from 'lucide-react';

export default function WalletConnectionModal({ isOpen, onClose }) {
  const features = [
    {
      icon: Shield,
      title: 'Secure Connection',
      description: 'Your wallet will be connected securely using industry-standard protocols'
    },
    {
      icon: Zap,
      title: 'Instant Payments',
      description: 'Receive SOL payments immediately after completing each task'
    },
    {
      icon: CheckCircle,
      title: 'Easy Setup',
      description: 'One-click connection with popular Solana wallets like Phantom and Solflare'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl p-8 max-w-md w-full relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-secondary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Wallet Connection Coming Soon!
              </h2>
              <p className="text-gray-600">
                We're putting the finishing touches on our secure wallet integration. 
                You'll be able to connect and start earning very soon!
              </p>
            </div>

            {/* Timeline */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-2">
                <Clock className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-semibold text-blue-900">Expected Launch</span>
              </div>
              <p className="text-blue-800 text-sm">
                Wallet connection will be available within the next few days. 
                We're currently testing with multiple wallet providers to ensure the best experience.
              </p>
            </div>

            {/* Features Preview */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">What to Expect:</h3>
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-4 h-4 text-secondary-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {feature.title}
                      </div>
                      <div className="text-gray-600 text-xs">
                        {feature.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notification Signup */}
            <div className="mb-6 p-4 bg-gradient-to-r from-secondary-50 to-accent-50 border border-secondary-200 rounded-lg">
              <div className="flex items-center mb-2">
                <Bell className="w-5 h-5 text-secondary-600 mr-2" />
                <span className="font-semibold text-secondary-900">Get Notified</span>
              </div>
              <p className="text-secondary-700 text-sm mb-3">
                Be the first to know when wallet connection goes live!
              </p>
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                />
                <button className="bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  Notify Me
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Got It
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-secondary-600 hover:bg-secondary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                Explore Features
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}