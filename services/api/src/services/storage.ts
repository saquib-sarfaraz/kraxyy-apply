import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

export interface FileUploadResult {
  filename: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  provider: 'cloudinary' | 'local';
}

export interface IStorageProvider {
  saveFile(file: Express.Multer.File): Promise<FileUploadResult>;
  deleteFile(filename: string): Promise<boolean>;
  getFileUrl(filename: string): string;
}

export class LocalStorageProvider implements IStorageProvider {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    this.baseUrl = process.env.API_URL || 'http://localhost:5001';

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<FileUploadResult> {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `resume-${uniqueSuffix}${ext}`;
    const destination = path.join(this.uploadDir, filename);

    if (file.buffer) {
      await fs.promises.writeFile(destination, file.buffer);
    } else if (file.path) {
      await fs.promises.copyFile(file.path, destination);
    }

    return {
      filename,
      originalName: file.originalname,
      fileUrl: `${this.baseUrl}/uploads/${filename}`,
      fileSize: file.size,
      mimeType: file.mimetype,
      provider: 'local'
    };
  }

  async deleteFile(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  getFileUrl(filename: string): string {
    return `${this.baseUrl}/uploads/${filename}`;
  }
}

export class CloudinaryStorageProvider implements IStorageProvider {
  private isConfigured: boolean = false;
  private localFallback: LocalStorageProvider;

  constructor() {
    this.localFallback = new LocalStorageProvider();

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (
      cloudName &&
      apiKey &&
      apiSecret &&
      !cloudName.includes('your_') &&
      !apiKey.includes('your_') &&
      !apiSecret.includes('your_')
    ) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });
      this.isConfigured = true;
    }
  }

  async saveFile(file: Express.Multer.File): Promise<FileUploadResult> {
    if (!this.isConfigured) {
      // Graceful local fallback for local development or testing
      return this.localFallback.saveFile(file);
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'kraxyy_resumes',
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true
        },
        (error, result) => {
          if (error || !result) {
            return reject(new Error(`Cloudinary upload failed: ${error?.message || 'Unknown error'}`));
          }

          resolve({
            filename: result.public_id,
            originalName: file.originalname,
            fileUrl: result.secure_url,
            fileSize: result.bytes || file.size,
            mimeType: file.mimetype,
            provider: 'cloudinary'
          });
        }
      );

      if (file.buffer) {
        uploadStream.end(file.buffer);
      } else if (file.path) {
        fs.createReadStream(file.path).pipe(uploadStream);
      } else {
        reject(new Error('No file buffer or path provided for Cloudinary upload'));
      }
    });
  }

  async deleteFile(filename: string): Promise<boolean> {
    if (!this.isConfigured) {
      return this.localFallback.deleteFile(filename);
    }

    try {
      const result = await cloudinary.uploader.destroy(filename, { resource_type: 'raw' });
      return result.result === 'ok';
    } catch {
      return false;
    }
  }

  getFileUrl(filename: string): string {
    if (!this.isConfigured) {
      return this.localFallback.getFileUrl(filename);
    }
    return cloudinary.url(filename, { secure: true });
  }
}

export const storageProvider: IStorageProvider = new CloudinaryStorageProvider();
