import { join } from 'path';

// 앱 모듈이 import 되기 전에 실행 (jest setupFiles) → .env 보다 우선
export const DB = join(__dirname, 'e2e.db');
export const UPLOADS = join(__dirname, 'e2e-uploads');
process.env.UPLOAD_DIR = UPLOADS; // 테스트 업로드가 실제 uploads/ 에 섞이지 않도록
process.env.DATABASE_URL = `file:${DB}`;
process.env.JWT_SECRET = 'e2e-secret-e2e-secret-e2e-secret-123';
process.env.MEME_VAULT_ADDRESS = ''; // 블록체인 비활성 → 환전 시 환불 경로 (실제 토큰 전송 방지)
