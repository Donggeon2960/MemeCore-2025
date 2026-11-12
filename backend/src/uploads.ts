import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { memoryStorage } from 'multer';
import { join } from 'path';

export const UPLOAD_DIR =
  process.env.UPLOAD_DIR || join(__dirname, '..', 'uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

/** FileInterceptor 옵션: 메모리에 받고(검증 전엔 디스크에 안 씀) 5MB 제한 */
export const imageUpload = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
};

/** 파일 시그니처(매직 바이트)로 실제 이미지 형식 판별. 확장자/클라이언트 MIME 은 믿지 않음 */
export function sniffImage(buf: Buffer): { ext: string; mime: string } | null {
  const ascii = (a: number, b: number) => buf.subarray(a, b).toString('latin1');
  if (
    buf.length >= 8 &&
    buf.readUInt32BE(0) === 0x89504e47 &&
    buf.readUInt32BE(4) === 0x0d0a1a0a
  )
    return { ext: 'png', mime: 'image/png' };
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return { ext: 'jpg', mime: 'image/jpeg' };
  if (['GIF87a', 'GIF89a'].includes(ascii(0, 6)))
    return { ext: 'gif', mime: 'image/gif' };
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP')
    return { ext: 'webp', mime: 'image/webp' };
  return null;
}

export type Image = { buffer: Buffer; ext: string; mime: string };

export function readImage(file?: Express.Multer.File): Image {
  if (!file) throw new BadRequestException('이미지 파일을 첨부해주세요.');
  const type = sniffImage(file.buffer);
  if (!type)
    throw new BadRequestException(
      'PNG, JPG, GIF, WEBP 이미지만 업로드할 수 있습니다.',
    );
  return { buffer: file.buffer, ...type };
}

/** 서버가 만든 이름 + 검증된 확장자로만 저장 → /uploads/<prefix>-<uuid>.<ext> */
export async function saveImage(img: Image, prefix: string) {
  const name = `${prefix}-${randomUUID()}.${img.ext}`;
  await writeFile(join(UPLOAD_DIR, name), img.buffer);
  return `/uploads/${name}`;
}
