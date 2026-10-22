declare module "multer-storage-cloudinary" {
  import type { StorageEngine } from "multer";
  import type { v2 } from "cloudinary";

  export class CloudinaryStorage {
    _handleFile: StorageEngine["_handleFile"];
    _removeFile: StorageEngine["_removeFile"];
    constructor(options: {
      cloudinary: typeof v2;
      params: (request: Express.Request, file: Express.Multer.File) => Promise<Record<string, unknown>>;
    });
  }
}
