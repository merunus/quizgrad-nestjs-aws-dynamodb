import { config } from "dotenv";
config();

export const validImageFileFormatsRegex = /\.(jpg|jpeg|png|svg|gif)$/;
export const MULTER_FILE_SIZE_LIMIT = 5 * 1024 * 1024;
export const S3_STORAGE_BASE_URL = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com`;

export const allowedCorsOrigins = [
	process.env.VERCEL_ORIGIN_URL, // Deployed URL
	"http://localhost:3000" // Localhost URL for development
];
