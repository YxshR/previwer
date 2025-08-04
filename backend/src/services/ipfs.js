import { create } from 'ipfs-http-client';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class IPFSService {
  constructor() {
    // Initialize IPFS client with Infura or local node
    const auth = process.env.IPFS_PROJECT_ID && process.env.IPFS_PROJECT_SECRET
      ? 'Basic ' + Buffer.from(process.env.IPFS_PROJECT_ID + ':' + process.env.IPFS_PROJECT_SECRET).toString('base64')
      : undefined;

    this.client = create({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
      headers: auth ? { authorization: auth } : {}
    });

    this.gatewayUrl = process.env.IPFS_GATEWAY_URL || 'https://ipfs.infura.io/ipfs/';
  }

  /**
   * Upload a file to IPFS
   * @param {Buffer} fileBuffer - File buffer to upload
   * @param {string} filename - Original filename
   * @returns {Promise<Object>} Upload result with hash and URL
   */
  async uploadFile(fileBuffer, filename) {
    try {
      console.log(`Uploading file to IPFS: ${filename}`);
      
      const result = await this.client.add({
        path: filename,
        content: fileBuffer
      }, {
        pin: true, // Pin the file to prevent garbage collection
        wrapWithDirectory: false
      });

      const hash = result.cid.toString();
      const url = `${this.gatewayUrl}${hash}`;

      console.log(`File uploaded to IPFS: ${hash}`);

      return {
        success: true,
        hash,
        url,
        size: result.size
      };
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload multiple files to IPFS
   * @param {Array} files - Array of {buffer, filename} objects
   * @returns {Promise<Array>} Array of upload results
   */
  async uploadMultipleFiles(files) {
    try {
      const uploadPromises = files.map(file => 
        this.uploadFile(file.buffer, file.filename)
      );

      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Error uploading multiple files to IPFS:', error);
      throw error;
    }
  }

  /**
   * Retrieve file from IPFS
   * @param {string} hash - IPFS hash of the file
   * @returns {Promise<Buffer>} File buffer
   */
  async getFile(hash) {
    try {
      const chunks = [];
      for await (const chunk of this.client.cat(hash)) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error retrieving file from IPFS:', error);
      throw error;
    }
  }

  /**
   * Get file info from IPFS
   * @param {string} hash - IPFS hash of the file
   * @returns {Promise<Object>} File information
   */
  async getFileInfo(hash) {
    try {
      const stat = await this.client.files.stat(`/ipfs/${hash}`);
      return {
        hash,
        size: stat.size,
        type: stat.type,
        url: `${this.gatewayUrl}${hash}`
      };
    } catch (error) {
      console.error('Error getting file info from IPFS:', error);
      throw error;
    }
  }

  /**
   * Pin a file to IPFS (prevent garbage collection)
   * @param {string} hash - IPFS hash to pin
   * @returns {Promise<boolean>} Success status
   */
  async pinFile(hash) {
    try {
      await this.client.pin.add(hash);
      console.log(`File pinned: ${hash}`);
      return true;
    } catch (error) {
      console.error('Error pinning file:', error);
      return false;
    }
  }

  /**
   * Unpin a file from IPFS
   * @param {string} hash - IPFS hash to unpin
   * @returns {Promise<boolean>} Success status
   */
  async unpinFile(hash) {
    try {
      await this.client.pin.rm(hash);
      console.log(`File unpinned: ${hash}`);
      return true;
    } catch (error) {
      console.error('Error unpinning file:', error);
      return false;
    }
  }

  /**
   * Check if IPFS node is accessible
   * @returns {Promise<boolean>} Connection status
   */
  async checkConnection() {
    try {
      // Skip connection check if no credentials are provided
      if (!process.env.IPFS_PROJECT_ID || !process.env.IPFS_PROJECT_SECRET) {
        console.log('IPFS credentials not configured, skipping connection check');
        return false;
      }
      
      const version = await this.client.version();
      console.log(`Connected to IPFS node version: ${version.version}`);
      return true;
    } catch (error) {
      console.error('IPFS connection failed:', error);
      return false;
    }
  }

  /**
   * Get IPFS URL for a hash
   * @param {string} hash - IPFS hash
   * @returns {string} Full IPFS URL
   */
  getUrl(hash) {
    return `${this.gatewayUrl}${hash}`;
  }

  /**
   * Validate IPFS hash format
   * @param {string} hash - Hash to validate
   * @returns {boolean} Whether hash is valid
   */
  isValidHash(hash) {
    // Basic validation for IPFS hash (CIDv0 and CIDv1)
    const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
    const cidv1Regex = /^b[a-z2-7]{58}$/;
    
    return cidv0Regex.test(hash) || cidv1Regex.test(hash);
  }

  /**
   * Upload file with metadata
   * @param {Buffer} fileBuffer - File buffer
   * @param {Object} metadata - File metadata
   * @returns {Promise<Object>} Upload result with metadata
   */
  async uploadWithMetadata(fileBuffer, metadata) {
    try {
      // Upload the actual file
      const fileResult = await this.uploadFile(fileBuffer, metadata.filename);
      
      if (!fileResult.success) {
        return fileResult;
      }

      // Create metadata object
      const metadataObj = {
        ...metadata,
        ipfsHash: fileResult.hash,
        uploadedAt: new Date().toISOString(),
        size: fileResult.size
      };

      // Upload metadata as JSON
      const metadataBuffer = Buffer.from(JSON.stringify(metadataObj, null, 2));
      const metadataResult = await this.uploadFile(metadataBuffer, `${metadata.filename}.metadata.json`);

      return {
        success: true,
        fileHash: fileResult.hash,
        fileUrl: fileResult.url,
        metadataHash: metadataResult.hash,
        metadataUrl: metadataResult.url,
        metadata: metadataObj
      };
    } catch (error) {
      console.error('Error uploading file with metadata:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Batch upload files for a task
   * @param {Array} files - Array of file objects with buffers and metadata
   * @param {string} taskId - Task ID for organization
   * @returns {Promise<Object>} Batch upload result
   */
  async uploadTaskFiles(files, taskId) {
    try {
      const results = [];
      
      for (const file of files) {
        const metadata = {
          ...file.metadata,
          taskId,
          filename: file.filename
        };
        
        const result = await this.uploadWithMetadata(file.buffer, metadata);
        results.push(result);
      }

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      return {
        success: failed.length === 0,
        totalFiles: files.length,
        successful: successful.length,
        failed: failed.length,
        results,
        taskId
      };
    } catch (error) {
      console.error('Error in batch upload:', error);
      throw error;
    }
  }
}

export default new IPFSService();