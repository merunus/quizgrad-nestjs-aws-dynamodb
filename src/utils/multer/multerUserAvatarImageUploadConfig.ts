import * as multer from "multer";
import { MULTER_FILE_SIZE_LIMIT, validImageFileFormatsRegex } from "src/constants/core.constants";

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
