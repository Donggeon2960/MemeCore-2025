import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { execSync } from 'child_process';
import { rmSync } from 'fs';
import { Wallet } from 'ethers';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { DB, UPLOADS } from './e2e-env';

describe('MemeQuest API (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;
  const wallets = [Wallet.createRandom(), Wallet.createRandom()];

  const register = (id: string, w: { address: string }) =>
    http.post('/api/register').send({
      login_id: id,
      password: 'password-1234',
      nickname: id,
      wallet_address: w.address,
    });

  beforeAll(async () => {
    rmSync(DB, { force: true });
    execSync('npx prisma db push --skip-generate', {
      env: process.env,
      stdio: 'ignore',
    });
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app?.close();
    rmSync(DB, { force: true });
    rmSync(UPLOADS, { recursive: true, force: true });
  });

  it('회원가입 응답에 비밀번호가 없고, 첫 가입자만 관리자', async () => {
    const admin = await register('admin1', wallets[0]).expect(201);
    expect(admin.body.token).toBeTruthy();
    expect(JSON.stringify(admin.body)).not.toContain('password');
    expect(admin.body.user.isAdmin).toBe(true);
    const user = await register('user1', wallets[1]).expect(201);
    expect(user.body.user.isAdmin).toBe(false);
  });

  it('토큰 없이 보호된 API 호출 불가, 남의 login_id 를 보내도 무시', async () => {
    await http
      .post('/api/swap-to-token')
      .send({ login_id: 'admin1', amount: 1 })
      .expect(401);
    await http
      .post('/api/update-profile')
      .send({ login_id: 'admin1', wallet_address: wallets[1].address })
      .expect(401);
  });

  it('잘못된 비밀번호 로그인 실패, 일반 유저는 관리자 API 403', async () => {
    await http
      .post('/api/login')
      .send({ login_id: 'user1', password: 'nope-nope' })
      .expect(401);
    const { body } = await http
      .post('/api/login')
      .send({ login_id: 'user1', password: 'password-1234' })
      .expect(201);
    await http
      .post('/api/reset-ranking')
      .set('Authorization', `Bearer ${body.token}`)
      .expect(403);
    await http
      .post('/api/reward-event-winners')
      .set('Authorization', `Bearer ${body.token}`)
      .send({ event_id: 1 })
      .expect(403);
  });

  it('치트/테스트 엔드포인트 삭제됨', async () => {
    await http
      .post('/api/cheat-points')
      .send({ login_id: 'user1', amount: 999 })
      .expect(404);
    await http
      .post('/test-reward')
      .send({ address: wallets[1].address, amount: '1' })
      .expect(404);
  });

  it('환전: 소수/잔액 초과 거부, 체인 실패 시 포인트 환불', async () => {
    const { body } = await http
      .post('/api/login')
      .send({ login_id: 'user1', password: 'password-1234' });
    const auth = { Authorization: `Bearer ${body.token}` };
    await http
      .post('/api/swap-to-token')
      .set(auth)
      .send({ amount: 0.9 })
      .expect(400);
    await http
      .post('/api/swap-to-token')
      .set(auth)
      .send({ amount: 10 })
      .expect(400); // 잔액 0

    const prisma = app.get(PrismaService);
    await prisma.user.update({
      where: { loginId: 'user1' },
      data: { points: 50 },
    });
    const res = await http
      .post('/api/swap-to-token')
      .set(auth)
      .send({ amount: 30 })
      .expect(400);
    expect(res.body.message).toContain('환불');
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { loginId: 'user1' } }))
        .points,
    ).toBe(50);
    const ledger = await prisma.pointLedger.findMany({
      orderBy: { id: 'asc' },
    });
    expect(ledger.map((l) => [l.reason, l.status])).toEqual([
      ['SWAP', 'FAILED'],
      ['SWAP_REFUND', 'DONE'],
    ]);
  });

  it('지갑 서명 로그인 (SIWE)', async () => {
    const w = wallets[1];
    const { body } = await http
      .get(`/api/auth/nonce?address=${w.address}`)
      .expect(200);
    // 다른 지갑의 서명 → 거부
    await http
      .post('/api/login-wallet')
      .send({
        address: w.address,
        signature: await wallets[0].signMessage(body.message),
      })
      .expect(401);
    const fresh = await http.get(`/api/auth/nonce?address=${w.address}`);
    const signature = await w.signMessage(fresh.body.message);
    const ok = await http
      .post('/api/login-wallet')
      .send({ address: w.address, signature })
      .expect(201);
    expect(ok.body.user.loginId).toBe('user1');
    // 같은 서명 재사용(replay) → nonce 1회용이라 거부
    await http
      .post('/api/login-wallet')
      .send({ address: w.address, signature })
      .expect(400);
  });

  it('이벤트: 시드 생성, 마감 전 정산 불가', async () => {
    const { body } = await http
      .post('/api/login')
      .send({ login_id: 'admin1', password: 'password-1234' });
    const auth = { Authorization: `Bearer ${body.token}` };
    const events = await http.get('/api/events').set(auth).expect(200);
    expect(events.body).toHaveLength(2);
    await http
      .post('/api/reward-event-winners')
      .set(auth)
      .send({ event_id: events.body[0].id })
      .expect(400);
  });

  it('이벤트: 이미지 위장 파일 거부, 1인 1작품, 마감 후 1회만 정산', async () => {
    const login = async (id: string) =>
      (
        await http
          .post('/api/login')
          .send({ login_id: id, password: 'password-1234' })
      ).body.token as string;
    const admin = { Authorization: `Bearer ${await login('admin1')}` };
    const user = { Authorization: `Bearer ${await login('user1')}` };
    const [event] = (await http.get('/api/events').set(user)).body;
    const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

    await http
      .post('/api/submit-event')
      .set(user)
      .field('event_id', event.id)
      .attach('image', Buffer.from('<svg onload=alert(1)>'), 'x.png')
      .expect(400);
    await http
      .post('/api/submit-event')
      .set(user)
      .field('event_id', event.id)
      .attach('image', png, 'a.png')
      .expect(201);
    await http
      .post('/api/submit-event')
      .set(user)
      .field('event_id', event.id)
      .attach('image', png, 'b.png')
      .expect(400);

    const prisma = app.get(PrismaService);
    const before = (
      await prisma.user.findUniqueOrThrow({ where: { loginId: 'user1' } })
    ).points;
    await prisma.quest.update({
      where: { id: event.id },
      data: { endsAt: new Date(Date.now() - 1000) },
    });
    const [entry] = (
      await http.get(`/api/event-entries?event_id=${event.id}`).set(user)
    ).body;
    await http
      .post('/api/like-image')
      .set(user)
      .send({ submission_id: entry.id })
      .expect(400); // 마감 후 투표 불가

    const settled = await http
      .post('/api/reward-event-winners')
      .set(admin)
      .send({ event_id: event.id })
      .expect(201);
    expect(settled.body.results[0]).toContain('user1');
    await http
      .post('/api/reward-event-winners')
      .set(admin)
      .send({ event_id: event.id })
      .expect(400);
    const after = (
      await prisma.user.findUniqueOrThrow({ where: { loginId: 'user1' } })
    ).points;
    expect(after - before).toBe(5000);
  });
});
