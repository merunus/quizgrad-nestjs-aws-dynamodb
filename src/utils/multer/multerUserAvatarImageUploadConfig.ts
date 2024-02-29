import * as multer from "multer";
import { MULTER_FILE_SIZE_LIMIT, validImageFileFormatsRegex } from "../../constants/core.constants";

export const multerUserAvatarImageUploadConfig = {
	storage: multer.memoryStorage(),
	fileFilter: (req, file, callback: multer.FileFilterCallback) => {
		if (!file.originalname.match(validImageFileFormatsRegex)) {
			return callback(new Error("Only images are allowed"));
		}
		callback(null, true);
	},
	limits: { fileSize: MULTER_FILE_SIZE_LIMIT } // 5mb is limit
} as multer.Options;

// How to get access to the uploaded images
// Enabling Public Read Access for Avatar Images in S3 Bucket

// 1. Set Object ACL to 'public-read' on Upload:
// - When uploading an avatar image to S3, include the ACL setting in the upload parameters to make the object publicly readable.
// - Example: ACL: 'public-read'

// 2. Update S3 Bucket Policy for Public Access:
// - Navigate to the S3 bucket in the AWS Management Console.
// - Go to the Permissions tab and click on Bucket Policy.
// - Add the following policy, replacing 'quizgrad-images' with your bucket name, to allow public read access to objects under 'avatars/':

// {
//   "Version": "2012-10-17",
//   "Statement": [{
//     "Sid": "PublicReadForAvatars",
//     "Effect": "Allow",
//     "Principal": "*",
//     "Action": "s3:GetObject",
//     "Resource": "arn:aws:s3:::quizgrad-images/avatars/*"
//   }]
// }

// 3. Enable Object Ownership with ACLs:
// - Still in the S3 bucket settings, find the Object Ownership section under the Permissions tab.
// - Choose "ACLs enabled" to allow ACLs to manage permissions.
// - This step ensures that the 'public-read' ACL and bucket policy effectively grant the intended public access to your avatar images.
