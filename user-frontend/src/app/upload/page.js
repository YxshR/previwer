'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle, 
  CreditCard,
  FileImage,
  FileVideo,
  Loader2,
  ArrowLeft,
  Info,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || '0x9d7834C376B2b722c5693af588C3e7a03Ea8e44D';

export default function UploadPage() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedService = searchParams.get('service');

  const [step, setStep] = useState(1); // 1: Service Selection, 2: File Upload, 3: Payment, 4: Processing
  const [selectedService, setSelectedService] = useState(preselectedService || '');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [taskId, setTaskId] = useState(null);
  const [pricing, setPricing] = useState(null);

  // Fetch pricing information
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/v1/user/pricing`);
        setPricing(response.data.data);
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
        toast.error('Failed to load pricing information');
      }
    };

    fetchPricing();
  }, []);

  // Service configurations
  const services = {
    MARKETING_IMAGES: {
      title: 'Marketing Images',
      description: 'Optimize your marketing visuals for maximum impact',
      acceptedTypes: 'image/*',
      maxFiles: 5,
      icon: FileImage,
      color: 'from-blue-500 to-cyan-500'
    },
    YOUTUBE_THUMBNAILS: {
      title: 'YouTube Thumbnails',
      description: 'Optimize thumbnails for higher click-through rates',
      acceptedTypes: 'image/*',
      maxFiles: 5,
      icon: FileImage,
      color: 'from-red-500 to-pink-500'
    },
    VIDEOS: {
      title: 'Video Content',
      description: 'Evaluate video content for engagement potential',
      acceptedTypes: 'video/*',
      maxFiles: 3,
      icon: FileVideo,
      color: 'from-purple-500 to-indigo-500'
    }
  };

  // File drop handler
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      toast.error('Some files were rejected. Please check file types and sizes.');
      return;
    }

    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      status: 'ready'
    }));

    setFiles(prev => [...prev, ...newFiles].slice(0, services[selectedService]?.maxFiles || 5));
  }, [selectedService]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: selectedService ? { [services[selectedService].acceptedTypes]: [] } : {},
    maxFiles: services[selectedService]?.maxFiles || 5,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: !selectedService
  });

  // Remove file
  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Handle service selection
  const handleServiceSelect = (serviceId) => {
    setSelectedService(serviceId);
    setSelectedPlan(null);
    setFiles([]);
    setStep(2);
  };

  // Handle plan selection
  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  // Process payment and upload
  const handlePaymentAndUpload = async () => {
    if (!connected || !publicKey || !selectedPlan || files.length === 0) {
      toast.error('Please complete all steps before proceeding');
      return;
    }

    setProcessing(true);
    setStep(4);

    try {
      // Create Solana connection
      const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

      // Calculate payment amount in lamports
      const amountLamports = selectedPlan.lamports;

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(ADMIN_WALLET),
          lamports: amountLamports,
        })
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success('Payment confirmed! Uploading files...');

      // Prepare form data for file upload
      const formData = new FormData();
      formData.append('serviceType', selectedService);
      formData.append('reviewCount', selectedPlan.reviews.toString());
      formData.append('signature', signature);

      files.forEach((fileObj, index) => {
        formData.append('files', fileObj.file);
      });

      // Get auth token (you'll need to implement authentication)
      const token = localStorage.getItem('authToken');
      
      // Upload files
      const uploadResponse = await axios.post(
        `${API_BASE_URL}/v1/user/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': token || ''
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      );

      if (uploadResponse.data.success) {
        setTaskId(uploadResponse.data.data.taskId);
        toast.success('Upload successful! Your task has been created.');
        
        // Redirect to task details after a delay
        setTimeout(() => {
          router.push(`/dashboard/task/${uploadResponse.data.data.taskId}`);
        }, 2000);
      } else {
        throw new Error(uploadResponse.data.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Payment/Upload error:', error);
      toast.error(error.message || 'Payment or upload failed');
      setStep(3); // Go back to payment step
    } finally {
      setProcessing(false);
    }
  };

  // Render service selection
  const renderServiceSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Service
        </h1>
        <p className="text-lg text-gray-600">
          Select the type of content you want to evaluate
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(services).map(([serviceId, service]) => (
          <motion.div
            key={serviceId}
            className="service-card cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleServiceSelect(serviceId)}
          >
            <div className={`w-16 h-16 bg-gradient-to-r ${service.color} rounded-2xl flex items-center justify-center mb-4`}>
              <service.icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {service.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {service.description}
            </p>
            <div className="text-sm text-gray-500">
              Max {service.maxFiles} files • {service.acceptedTypes.replace('/*', 's')}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  // Render file upload
  const renderFileUpload = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Upload Your {services[selectedService]?.title}
        </h1>
        <p className="text-lg text-gray-600">
          {services[selectedService]?.description}
        </p>
      </div>

      {/* File Upload Area */}
      <div
        {...getRootProps()}
        className={`upload-area mb-8 ${isDragActive ? 'upload-area-active' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-gray-600 mb-4">
          or click to browse files
        </p>
        <div className="text-sm text-gray-500">
          Max {services[selectedService]?.maxFiles} files • Up to 50MB each
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 mb-8"
          >
            {files.map((fileObj) => (
              <motion.div
                key={fileObj.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center p-4 bg-gray-50 rounded-lg"
              >
                {fileObj.preview ? (
                  <img
                    src={fileObj.preview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg mr-4"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                    <FileVideo className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {fileObj.file.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>

                <button
                  onClick={() => removeFile(fileObj.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan Selection */}
      {files.length > 0 && pricing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pricing[selectedService] && Object.entries(pricing[selectedService]).map(([reviewCount, plan]) => (
              <motion.div
                key={reviewCount}
                className={`card cursor-pointer border-2 transition-all ${
                  selectedPlan?.reviews === parseInt(reviewCount)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePlanSelect({
                  reviews: parseInt(reviewCount),
                  ...plan
                })}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {reviewCount} Reviews
                    </div>
                    <div className="text-sm text-gray-600">
                      {plan.sol} SOL (${plan.usd})
                    </div>
                  </div>
                  {parseInt(reviewCount) === 500 || parseInt(reviewCount) === 300 ? (
                    <span className="badge-primary">Popular</span>
                  ) : null}
                </div>
                
                <div className="text-sm text-gray-600">
                  Get feedback from {reviewCount} real evaluators
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep(1)}
          className="btn-ghost"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        
        {files.length > 0 && selectedPlan && (
          <button
            onClick={() => setStep(3)}
            className="btn-primary"
          >
            Continue to Payment
            <CreditCard className="w-5 h-5 ml-2" />
          </button>
        )}
      </div>
    </motion.div>
  );

  // Render payment confirmation
  const renderPayment = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Confirm Your Order
        </h1>
        <p className="text-lg text-gray-600">
          Review your selection and complete payment
        </p>
      </div>

      {/* Order Summary */}
      <div className="card mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Service</span>
            <span className="font-medium">{services[selectedService]?.title}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Files</span>
            <span className="font-medium">{files.length} files</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Reviews</span>
            <span className="font-medium">{selectedPlan?.reviews} evaluators</span>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${selectedPlan?.usd} ({selectedPlan?.sol} SOL)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Connection */}
      {!connected ? (
        <div className="text-center">
          <p className="text-gray-600 mb-4">Connect your wallet to proceed with payment</p>
          <WalletMultiButton />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-success-50 border border-success-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-success-600 mr-3" />
            <span className="text-success-800">
              Wallet connected: {publicKey?.toString().slice(0, 8)}...
            </span>
          </div>

          <div className="flex items-start p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div className="text-blue-800 text-sm">
              <p className="font-medium mb-1">Payment will be processed on Solana blockchain</p>
              <p>Your files will be uploaded immediately after payment confirmation.</p>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="btn-ghost"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            
            <button
              onClick={handlePaymentAndUpload}
              disabled={processing}
              className="btn-primary"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay & Upload
                  <DollarSign className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );

  // Render processing
  const renderProcessing = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto text-center"
    >
      <div className="mb-8">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Processing Your Upload
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          Please wait while we process your payment and upload your files
        </p>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar mb-4">
        <div 
          className="progress-fill"
          style={{ width: `${uploadProgress}%` }}
        />
      </div>
      
      <p className="text-sm text-gray-600 mb-8">
        Upload Progress: {uploadProgress}%
      </p>

      {taskId && (
        <div className="flex items-center justify-center p-4 bg-success-50 border border-success-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-success-600 mr-3" />
          <span className="text-success-800">
            Task created successfully! Redirecting to dashboard...
          </span>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-2xl font-bold gradient-text">Previewer</span>
          </Link>

          {/* Progress Indicator */}
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNum}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {step === 1 && renderServiceSelection()}
          {step === 2 && renderFileUpload()}
          {step === 3 && renderPayment()}
          {step === 4 && renderProcessing()}
        </AnimatePresence>
      </div>
    </div>
  );
}