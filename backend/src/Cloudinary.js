// // Load environment variables
// import { v4 as uuidv4 } from "uuid";
// import cloudinary from "cloudinary";
// import dotenv from "dotenv";

// // Configure Cloudinary with env variables
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// function generateSignedUpload(publicId) {
//   const timestamp = Math.floor(Date.now() / 1000);
//   const fullPublicId = `uploads/${publicId}`; // Embed folder directly

//   const signature = cloudinary.utils.api_sign_request(
//     {
//       timestamp,
//       public_id: fullPublicId
//     },
//     process.env.CLOUDINARY_API_SECRET // Explicitly use secret from env
//   );

//   return {
//     timestamp,
//     signature,
//     public_id: fullPublicId,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`
//   };
// }

// module.exports = { generateSignedUpload };
