import {
	DeleteObjectCommand,
	PutObjectCommand,
	PutObjectCommandInput,
	S3Client
} from "@aws-sdk/client-s3";
import { Injectable } from "@nestjs/common";
import { throwHttpException } from "src/utils/throwHttpException";
import { RESPONSE_TYPES } from "../models/responseTypes";

@Injectable()
export class S3storageService {
	private s3Client: S3Client;

	constructor() {
		this.s3Client = new S3Client({
			region: process.env.AWS_REGION,
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
			}
		});
	}

	getS3Client(): S3Client {
		return this.s3Client;
	}

	async saveImageToStorage(fileKey: string, file: Express.Multer.File) {
		const params: PutObjectCommandInput = {
			Bucket: process.env.S3_BUCKET_NAME,
			Key: fileKey,
			Body: file.buffer,
			ContentType: file.mimetype,
			ACL: "public-read"
		};

		try {
			// Save the image in the S3 storage
			const saveAvatarCommand = new PutObjectCommand(params);
			await this.s3Client.send(saveAvatarCommand);
		} catch (error) {
			console.log(error);
			throwHttpException(
				RESPONSE_TYPES.SERVER_ERROR,
				`Failed to save image to s3 storage ${error}`
			);
		}
	}

	async removeFileFromStorage(key: string, folder: string) {
		const params = {
			Bucket: process.env.S3_BUCKET_NAME,
			Key: `${folder}/${this.extractFileKeyFromUrl(key)}`
		};
		try {
			// Delete the file from the S3 storage
			await this.s3Client.send(new DeleteObjectCommand(params));
		} catch (error) {
			throwHttpException(
				RESPONSE_TYPES.SERVER_ERROR,
				`Failed to remove image from s3 storage ${error}`
			);
		}
	}

	extractFileKeyFromUrl(url: string): string {
		// Check if the URL is already a simple file key without any slashes
		if (!url.includes("/")) return url;
		// Extract the file key from the URL
		const urlParts = url.split("/");
		// Get the last part of the URL
		const fileKey = urlParts.pop();
		if (!fileKey)
			throwHttpException(
				RESPONSE_TYPES.SERVER_ERROR,
				`Invalid URL ${fileKey}: cannot extract file key`
			);
		return fileKey;
	}
}
