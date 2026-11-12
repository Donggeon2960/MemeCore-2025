import { BadRequestException } from '@nestjs/common';
import { verifyMessage, Wallet } from 'ethers';
import { siweMessage } from './auth';
import { sniffImage } from './uploads';
import {
  checksumAddress,
  hashPassword,
  parseAmount,
  verifyPassword,
} from './modules/users/users.service';
import {
  extractVideoId,
  normalizeSnsUrl,
  SNS_BONUS_CAP,
  snsBonus,
} from './modules/youtube.service';

describe('보안/정산 핵심 로직', () => {
  it('비밀번호는 해시로 저장되고 검증된다', async () => {
    const h = await hashPassword('correct horse');
    expect(h).not.toContain('correct horse');
    await expect(verifyPassword('correct horse', h)).resolves.toBe(true);
    await expect(verifyPassword('wrong', h)).resolves.toBe(false);
    await expect(verifyPassword('plain', 'plain')).resolves.toBe(false); // 평문 저장값은 해시 비교로 통과 불가
  });

  it('환전 금액은 1 이상의 정수만 (소수 환전으로 포인트가 안 줄던 버그)', () => {
    expect(parseAmount('100')).toBe(100);
    for (const bad of [0.9, '0.5', -5, 0, 'abc', NaN, Infinity, 2 ** 60, null])
      expect(() => parseAmount(bad)).toThrow(BadRequestException);
  });

  it('지갑 주소 검증 + 체크섬 정규화', () => {
    const addr = Wallet.createRandom().address;
    expect(checksumAddress(addr.toLowerCase())).toBe(addr);
    expect(() => checksumAddress('0x123')).toThrow(BadRequestException);
  });

  it('유튜브 URL: Shorts 지원, 타 도메인 차단', () => {
    const id = 'dQw4w9WgXcQ';
    for (const ok of [
      `https://www.youtube.com/watch?v=${id}&t=5`,
      `https://youtu.be/${id}`,
      `https://youtube.com/shorts/${id}?feature=share`,
      `https://m.youtube.com/embed/${id}`,
    ])
      expect(extractVideoId(ok)).toBe(id);
    for (const bad of [
      `https://evil.example/watch?v=${id}`,
      `https://youtube.com.evil.example/watch?v=${id}`,
      `javascript:alert(1)//youtu.be/${id}`,
      'https://youtu.be/short',
    ])
      expect(extractVideoId(bad)).toBeNull();
  });

  it('SNS URL 정규화: 쿼리 제거로 같은 게시물 중복 제출 방지, 타 도메인 차단', () => {
    expect(
      normalizeSnsUrl('Instagram', 'https://www.instagram.com/p/abc/?igsh=1'),
    ).toBe('https://www.instagram.com/p/abc');
    expect(normalizeSnsUrl('X', 'https://twitter.com/u/status/1')).toBe(
      'https://twitter.com/u/status/1',
    );
    expect(() =>
      normalizeSnsUrl('TikTok', 'https://nottiktok.com/@u/video/1'),
    ).toThrow(BadRequestException);
    expect(() => normalizeSnsUrl('X', 'http://x.com/u')).toThrow(
      BadRequestException,
    );
  });

  it('SNS 보너스: 음수 무시 + 상한', () => {
    expect(snsBonus(200, 3)).toBe(130);
    expect(snsBonus(-50, -2)).toBe(0);
    expect(snsBonus(10_000_000, 0)).toBe(SNS_BONUS_CAP);
  });

  it('업로드: 매직 바이트로만 이미지 판별 (HTML/SVG 차단)', () => {
    expect(sniffImage(Buffer.from('89504e470d0a1a0a0000', 'hex'))?.ext).toBe(
      'png',
    );
    expect(sniffImage(Buffer.from('ffd8ffe000', 'hex'))?.ext).toBe('jpg');
    expect(sniffImage(Buffer.from('<svg onload=alert(1)>'))).toBeNull();
    expect(sniffImage(Buffer.from('<html><script>'))).toBeNull();
  });

  it('지갑 로그인 메시지(SIWE) 서명 검증', async () => {
    const w = Wallet.createRandom();
    const msg = siweMessage({
      origin: 'http://localhost:3001',
      address: w.address,
      chainId: 43522,
      nonce: 'abc',
      issuedAt: new Date().toISOString(),
    });
    expect(msg).toContain('localhost:3001 wants you to sign in');
    expect(verifyMessage(msg, await w.signMessage(msg))).toBe(w.address);
  });
});
