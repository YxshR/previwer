import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';

dotenv.config();

class SolanaService {
  constructor() {
    this.connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
    this.adminWallet = new PublicKey(process.env.ADMIN_WALLET_ADDRESS);
  }

  /**
   * Verify a transaction signature on the Solana blockchain
   * @param {string} signature - Transaction signature to verify
   * @returns {Promise<Object>} Transaction details if valid
   */
  async verifyTransaction(signature) {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return {
        valid: true,
        transaction,
        amount: transaction.meta?.postBalances[1] - transaction.meta?.preBalances[1] || 0,
        from: transaction.transaction.message.accountKeys[0].toString(),
        to: transaction.transaction.message.accountKeys[1].toString(),
        blockTime: transaction.blockTime
      };
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Verify payment transaction for task creation
   * @param {string} signature - Transaction signature
   * @param {number} expectedAmount - Expected amount in lamports
   * @param {string} userWallet - User's wallet address
   * @returns {Promise<boolean>} Whether payment is valid
   */
  async verifyPayment(signature, expectedAmount, userWallet) {
    try {
      const result = await this.verifyTransaction(signature);
      
      if (!result.valid) {
        return false;
      }

      const { transaction } = result;
      
      // Check if payment was made to admin wallet
      const toAddress = transaction.transaction.message.accountKeys[1].toString();
      if (toAddress !== this.adminWallet.toString()) {
        console.error('Payment not made to admin wallet');
        return false;
      }

      // Check if payment came from user wallet
      const fromAddress = transaction.transaction.message.accountKeys[0].toString();
      if (fromAddress !== userWallet) {
        console.error('Payment not from expected user wallet');
        return false;
      }

      // Check amount (allowing for small transaction fees)
      const actualAmount = Math.abs(transaction.meta?.postBalances[1] - transaction.meta?.preBalances[1] || 0);
      const tolerance = 0.001 * LAMPORTS_PER_SOL; // 0.001 SOL tolerance for fees
      
      if (Math.abs(actualAmount - expectedAmount) > tolerance) {
        console.error(`Amount mismatch. Expected: ${expectedAmount}, Actual: ${actualAmount}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  /**
   * Send SOL to a worker's wallet
   * @param {string} workerAddress - Worker's wallet address
   * @param {number} amount - Amount in lamports
   * @returns {Promise<string>} Transaction signature
   */
  async sendReward(workerAddress, amount) {
    try {
      // In production, you would use the admin's private key to sign transactions
      // For now, we'll simulate the transaction
      console.log(`Simulating reward payment: ${amount} lamports to ${workerAddress}`);
      
      // Generate a mock transaction signature for development
      const mockSignature = bs58.encode(Buffer.from(Array.from({length: 64}, () => Math.floor(Math.random() * 256))));
      
      return mockSignature;
    } catch (error) {
      console.error('Error sending reward:', error);
      throw error;
    }
  }

  /**
   * Get current SOL price in USD (mock implementation)
   * @returns {Promise<number>} SOL price in USD
   */
  async getSolPrice() {
    try {
      // In production, you would fetch from a price API
      // Mock price for development
      return 100; // $100 per SOL
    } catch (error) {
      console.error('Error fetching SOL price:', error);
      return 100; // Default fallback price
    }
  }

  /**
   * Convert USD amount to lamports
   * @param {number} usdAmount - Amount in USD
   * @returns {Promise<number>} Amount in lamports
   */
  async usdToLamports(usdAmount) {
    const solPrice = await this.getSolPrice();
    const solAmount = usdAmount / solPrice;
    return Math.floor(solAmount * LAMPORTS_PER_SOL);
  }

  /**
   * Convert lamports to USD
   * @param {number} lamports - Amount in lamports
   * @returns {Promise<number>} Amount in USD
   */
  async lamportsToUsd(lamports) {
    const solPrice = await this.getSolPrice();
    const solAmount = lamports / LAMPORTS_PER_SOL;
    return solAmount * solPrice;
  }

  /**
   * Get service pricing in lamports
   * @param {string} serviceType - Type of service
   * @param {number} reviewCount - Number of reviews
   * @returns {number} Price in lamports
   */
  getServicePrice(serviceType, reviewCount) {
    const priceMap = {
      'MARKETING_IMAGES': {
        200: parseInt(process.env.MARKETING_IMAGES_200_PRICE),
        500: parseInt(process.env.MARKETING_IMAGES_500_PRICE)
      },
      'YOUTUBE_THUMBNAILS': {
        200: parseInt(process.env.YOUTUBE_THUMBNAILS_200_PRICE),
        500: parseInt(process.env.YOUTUBE_THUMBNAILS_500_PRICE)
      },
      'VIDEOS': {
        100: parseInt(process.env.VIDEOS_100_PRICE),
        300: parseInt(process.env.VIDEOS_300_PRICE)
      }
    };

    return priceMap[serviceType]?.[reviewCount] || 0;
  }

  /**
   * Calculate worker reward based on consensus
   * @param {string} serviceType - Type of service
   * @param {number} rank - Worker's rank (1, 2, 3)
   * @returns {number} Reward in lamports
   */
  calculateWorkerReward(serviceType, rank) {
    let baseReward;
    
    if (serviceType === 'VIDEOS') {
      baseReward = parseInt(process.env.VIDEO_MAJORITY_REWARD);
    } else {
      baseReward = parseInt(process.env.IMAGE_THUMBNAIL_MAJORITY_REWARD);
    }

    switch (rank) {
      case 1:
        return baseReward;
      case 2:
        return Math.floor(baseReward * parseFloat(process.env.SECOND_PLACE_MULTIPLIER));
      case 3:
        return Math.floor(baseReward * parseFloat(process.env.THIRD_PLACE_MULTIPLIER));
      default:
        return 0;
    }
  }

  /**
   * Validate wallet address format
   * @param {string} address - Wallet address to validate
   * @returns {boolean} Whether address is valid
   */
  isValidWalletAddress(address) {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }
}

export default new SolanaService();