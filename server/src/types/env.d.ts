declare namespace NodeJS {
  interface ProcessEnv {
    CLIENT_ORIGINS?: string;
    CLIENT_URL?: string;
    CLOUDINARY_API_KEY?: string;
    CLOUDINARY_API_SECRET?: string;
    CLOUDINARY_CLOUD_NAME?: string;
    CRON_TIMEZONE?: string;
    JWT_SECRET?: string;
    MONGO_URI?: string;
    NODE_ENV?: string;
    PORT?: string;
    SMTP_FROM?: string;
    SMTP_HOST?: string;
    SMTP_PASS?: string;
    SMTP_PORT?: string;
    SMTP_SECURE?: string;
    SMTP_USER?: string;
  }
}
