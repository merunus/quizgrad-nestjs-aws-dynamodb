import { FileFilterCallback } from "multer";
import { validImageFileFormatsRegex } from "src/constants/core.constants";

export const multerImageFilesFilter = (_, file, callback: FileFilterCallback) => {
    const filename = file.originalname.split("|")[0]; // Extract word index from the filename
    if (!filename.match(validImageFileFormatsRegex)) {
        return callback(new Error("Only images are allowed"));
    }
    callback(null, true);
}