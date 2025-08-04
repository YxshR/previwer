import React from 'react';
import { motion } from 'framer-motion';

const SkeletonLoader = ({ className = '', variant = 'rectangular', width, height, lines = 1 }) => {
  const baseClasses = 'bg-gray-200 animate-pulse';
  
  const variants = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4',
    card: 'rounded-xl h-48'
  };

  const shimmer = {
    initial: { backgroundPosition: '-200px 0' },
    animate: { backgroundPosition: '200px 0' },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear'
    }
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={`${baseClasses} ${variants[variant]} mb-2 last:mb-0`}
            style={{
              width: index === lines - 1 ? '75%' : '100%',
              height: height || '1rem'
            }}
            {...shimmer}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={`${baseClasses} ${variants[variant]} ${className}`}
      style={{ width, height }}
      {...shimmer}
    />
  );
};

export const CardSkeleton = ({ className = '' }) => (
  <div className={`card ${className}`}>
    <div className="flex items-start space-x-4 mb-4">
      <SkeletonLoader variant="circular" width="3rem" height="3rem" />
      <div className="flex-1">
        <SkeletonLoader variant="text" width="60%" className="mb-2" />
        <SkeletonLoader variant="text" width="40%" />
      </div>
    </div>
    <SkeletonLoader variant="text" lines={3} className="mb-4" />
    <SkeletonLoader variant="rectangular" height="2rem" width="30%" />
  </div>
);

export const TaskSkeleton = ({ className = '' }) => (
  <div className={`border border-gray-200 rounded-lg p-6 ${className}`}>
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <SkeletonLoader variant="text" width="70%" className="mb-2" />
        <div className="flex space-x-4">
          <SkeletonLoader variant="text" width="80px" />
          <SkeletonLoader variant="text" width="100px" />
          <SkeletonLoader variant="text" width="60px" />
        </div>
      </div>
      <div className="flex space-x-2">
        <SkeletonLoader variant="rectangular" width="80px" height="32px" />
        <SkeletonLoader variant="rectangular" width="60px" height="32px" />
      </div>
    </div>
    <div className="mb-4">
      <SkeletonLoader variant="text" width="30%" className="mb-2" />
      <SkeletonLoader variant="rectangular" height="8px" className="mb-2" />
    </div>
    <div className="flex justify-between">
      <SkeletonLoader variant="rectangular" width="120px" height="24px" />
      <SkeletonLoader variant="text" width="80px" />
    </div>
  </div>
);

export default SkeletonLoader;