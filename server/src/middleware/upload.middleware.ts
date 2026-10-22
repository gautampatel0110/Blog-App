import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_request, file) => ({
    folder: "blog-pages",
    resource_type: "auto",
    public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-")}`,
  }),
});

const upload = multer({ storage });
export default upload;
