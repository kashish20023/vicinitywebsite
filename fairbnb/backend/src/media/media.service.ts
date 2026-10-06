import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MediaService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async handleFileUpload(file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type '${file.mimetype}' is not allowed. Only JPEG, PNG, WEBP, and PDF files are accepted.`);
    }

    const maxSize = 10 * 1024 * 1024; // 10MB limit
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds maximum allowed limit of 10MB');
    }

    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `media_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    await fs.promises.writeFile(filePath, file.buffer);

    const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
    const publicUrl = `${baseUrl}/uploads/${filename}`;

    return {
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: publicUrl,
    };
  }

  async handleMultipleUploads(files: any[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const results: any[] = [];
    for (const f of files) {
      const res = await this.handleFileUpload(f);
      results.push(res);
    }

    return {
      count: results.length,
      files: results,
    };
  }
}
