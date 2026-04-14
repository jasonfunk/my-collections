import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { randomBytes } from 'crypto';
import { Response } from 'express';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import { memoryStorage } from 'multer';
import { join } from 'path';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
// Only hex filenames we generate are accepted — blocks path traversal entirely
const SAFE_FILENAME = /^[a-f0-9]{32}\.(jpg|jpeg|png|webp|gif)$/;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@ApiTags('collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collections/photos')
export class PhotosController {
  // COL-81: Authenticated photo delivery — replaces public ServeStaticModule
  @Get(':filename')
  @ApiOperation({ summary: 'Serve a collection photo (authenticated)' })
  async servePhoto(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!SAFE_FILENAME.test(filename)) throw new NotFoundException();
    const filePath = join(UPLOAD_DIR, filename);
    if (!existsSync(filePath)) throw new NotFoundException();
    res.sendFile(filePath);
  }

  // COL-82: Magic-bytes validation + randomized filenames
  @Post('upload')
  @ApiOperation({ summary: 'Upload a collection item photo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), // buffer in memory for magic-bytes check
      limits: { fileSize: MAX_SIZE_BYTES },
      // No fileFilter — trusting client mimetype is the vulnerability; validate below
    }),
  )
  async uploadPhoto(@UploadedFile() file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('No file provided');

    // Dynamic import: file-type is ESM-only; dynamic import() works in CJS Node.js
    const { fileTypeFromBuffer } = await import('file-type');
    const detected = await fileTypeFromBuffer(file.buffer);

    if (!detected || !ALLOWED_MIME.has(detected.mime)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, and GIF images are allowed');
    }

    // crypto.randomBytes(16) → 32 hex chars; no timestamp, no original name in filename
    const name = `${randomBytes(16).toString('hex')}.${detected.ext}`;
    await writeFile(join(UPLOAD_DIR, name), file.buffer);

    return { url: `/collections/photos/${name}` };
  }
}
