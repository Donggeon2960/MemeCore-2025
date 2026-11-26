# MemeCore-2025

# 🐸 MemeQuest: AI-Powered Viral SocialFi Platform on MemeCore

> **"Meme 2.0: Turn Your Viral Power into Real Value"**
> AI 검증과 블록체인 보상을 결합하여, 밈의 창작(Creation)과 확산(Viral)을 투명하게 보상하는 SocialFi 플랫폼입니다.

## 💡 Introduction
**MemeQuest**는 MemeCore 생태계의 비전인 **'Viral Economy'**를 실현하기 위한 dApp입니다.
사용자는 AI가 생성한 퀘스트에 맞춰 밈을 만들거나, SNS에 공유하여 바이럴을 일으키고, 그 기여도(조회수, 좋아요)에 따라 **Meme Vault**로부터 **$MQ 토큰**을 보상받습니다.

기존 Web3의 진입 장벽(가스비, 서명)을 낮추기 위해 **Server-Managed Wallet (Gasless)** 구조를 도입했습니다. 보상 수령 지갑 주소만 등록하면 되고, 원하면 그 지갑으로 **서명 로그인(Sign-In with Ethereum)** 도 할 수 있습니다.

## 🚀 Key Features

### 1. 🤖 AI Meme Challenge (Vision AI)
- **Google Gemini 2.5 Flash**가 업로드된 이미지가 퀘스트 주제에 맞는지 채점합니다 (70점 이상 통과).
- AI 장애 시 자동 통과시키지 않고 재시도를 안내합니다. 퀘스트는 유저당 최근 7일 동안 3회까지 생성할 수 있고, 통과한 이미지만 서버에 저장됩니다.

### 2. 📢 SNS Viral Verification (OCR & API)
- **YouTube:** **YouTube Data API**로 영상 **설명란에 내 고유 코드**가 있는지 확인해 본인 영상인지 검증합니다. 기본 300P에, 조회수 100회 이상이면 보너스(조회수 × 0.5 + 좋아요 × 10, 1회 상한 10,000P)를 더 줍니다. 이후 **매일 자정(KST)** 조회수·좋아요 증가분만큼 같은 식으로 추가 보너스가 지급됩니다.
- **Instagram / TikTok / X:** 스크린샷을 **Gemini OCR**로 분석해 고유 코드를 확인하고 기본 보상(300P)을 줍니다.
- 같은 게시물은 URL 형태가 달라도 한 번만 인정됩니다.

### 3. 💸 Gasless Reward System
- 백엔드 서버(Admin Wallet)가 트랜잭션 비용을 대납하고, **Meme Vault** 컨트랙트를 통해 토큰을 전송합니다. 1P는 $MQ 1개로 바뀝니다.
- 모든 포인트 적립/차감은 **포인트 원장(PointLedger)** 에 기록됩니다. 환전 시 포인트를 먼저 원자적으로 차감하고, 전송이 실패하면 자동으로 환불합니다. 전송은 됐지만 확정 확인이 늦어지면 이중 지급을 막기 위해 환불하지 않고 `PENDING` 상태로 남깁니다.

### 4. 🏆 SocialFi Ranking & Event
- 주간 랭킹은 **매주 월요일 00:00 (KST)** 에 자동 초기화됩니다.
- 테마 이벤트는 마감일·1인 1작품·좋아요 투표로 진행되고, 마감 후 관리자가 **Top 3에게 한 번만** 상금(5,000 / 3,000 / 1,000P)을 정산합니다. 마감 후에는 투표를 바꿀 수 없습니다.

### 5. 🔐 Security
- JWT 인증(유효기간 7일), scrypt 비밀번호 해시, 관리자 권한(`is_admin`) 가드
- 지갑 로그인 서명 메시지(nonce)는 5분 동안 한 번만 쓸 수 있음
- 업로드는 PNG/JPG/GIF/WEBP 5MB 이하만 허용 (파일 시그니처 검사, 서버가 만든 파일 이름으로 저장)
- 요청 횟수 제한: 기본 IP당 분당 120회, 로그인 분당 10회, AI 엔드포인트 분당 5회. CORS는 프론트 주소(`FRONTEND_URL`)만 허용

---

## ⛓️ Smart Contracts (MemeCore Testnet: Insectarium)

| Contract | 소스 | Description |
| :--- | :--- | :--- |
| **MemeVault** | `contracts/src/MemeVault.sol` | 보상 재원을 보관하고 분배하는 금고 컨트랙트. 1회 지급 상한(`maxPayout`), 일시정지(`pause`), 비상 회수(`emergencyWithdraw`), 이벤트 로그가 있습니다 |
| **MyToken ($MQ)** | `contracts/src/MyToken.sol` | 생태계 내에서 사용되는 유틸리티 토큰 (ERC-20) |

> **배포 상태:** 아직 테스트넷에 배포하지 않았습니다(2026-11-26 작성자 확인). 예전 README에 적혀 있던 주소 두 개는 저장소의 배포 기록(`contracts/broadcast/`)에도 없어서 지웠습니다. 배포하면 아래 배포 스크립트로 만들고, 나온 주소를 백엔드 `.env`의 `MY_TOKEN_ADDRESS`, `MEME_VAULT_ADDRESS`에 넣습니다.

- **Network:** MemeCore Insectarium Testnet
- **Chain ID:** 43522
- **RPC URL:** `https://rpc.insectarium.memecore.net`
- **배포 스크립트(`contracts/script/Deploy.s.sol`):** 토큰(이름 `MemeQuest`, 심볼 `MQ`, 처음 1,000,000 MQ 발행)과 MemeVault를 배포하고, 금고에 `INITIAL_FUNDING`(기본 500,000 MQ)을 넣습니다. 1회 지급 상한은 `MAX_PAYOUT`(기본 100,000 MQ)입니다.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 (Create React App, react-scripts 5.0.1)
- **Styling:** Plain CSS (Dark Theme, CSS 변수, 유틸리티 클래스)
- **Interaction:** REST API (Fetch + JWT), MetaMask (`window.ethereum`)

### Backend
- **Framework:** NestJS 11 (Node.js)
- **Database:** SQLite + Prisma ORM 5
- **Auth:** `@nestjs/jwt`, Node `crypto.scrypt`, SIWE (EIP-4361) 서명 검증
- **AI Integration:** Google Generative AI SDK (Gemini 2.5 Flash)
- **Blockchain:** Ethers.js v6
- **Scheduling:** NestJS Schedule (자정 바이럴 보너스, 월요일 랭킹 초기화)
- **Rate Limit:** `@nestjs/throttler`
- **Test:** Jest 30 (단위 테스트 + e2e)

### Blockchain
- **Language:** Solidity ^0.8.20
- **Framework:** Foundry (`forge-std` 1.12.0)
- **Standard:** ERC-20 (OpenZeppelin v5, 저장소에 5.5.0 포함), Ownable, Pausable

---

## 📁 Project Structure

```
MemeCore-2025/
├── backend/     # NestJS API 서버 (DB 스키마: prisma/schema.prisma)
├── frontend/    # React 앱 (화면은 src/App.js 한 파일)
└── contracts/   # Foundry 프로젝트 (src/MemeVault.sol, src/MyToken.sol, script/Deploy.s.sol, test/MemeVault.t.sol)
```

---

## 📡 API

모든 경로는 `http://localhost:3000/api/...` 입니다. `/register`, `/login`, `/auth/nonce`, `/login-wallet`을 뺀 나머지는 `Authorization: Bearer <JWT>` 헤더가 필요합니다.

| 구분 | 엔드포인트 |
| :--- | :--- |
| 인증 | `POST /register`, `POST /login`, `GET /auth/nonce`, `POST /login-wallet`, `GET /me` |
| AI 퀘스트 | `POST /generate-quest`, `GET /my-quests`, `POST /verify-meme`, `GET /gallery`, `POST /like-image`, `POST /comment` |
| SNS 바이럴 | `POST /submit-social` |
| 이벤트 | `GET /events`, `POST /submit-event`, `GET /event-entries`, `POST /events` (관리자), `POST /reward-event-winners` (관리자) |
| 랭킹 | `GET /rankings`, `GET /my-rank`, `POST /reset-ranking` (관리자) |
| 포인트·프로필 | `POST /swap-to-token`, `GET /point-history`, `POST /update-profile` |

업로드한 이미지는 `/uploads/...` 경로로 제공됩니다.

---

## ⚡ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Donggeon2960/MemeCore-2025.git
cd MemeCore-2025
```

---

### 2. Contracts (선택: 새로 배포할 때)
```bash
cd contracts
forge test           # MemeVault 테스트. 의존성(lib/)은 저장소에 포함되어 있음
forge script script/Deploy.s.sol --rpc-url https://rpc.insectarium.memecore.net \
  --private-key $ADMIN_PRIVATE_KEY --broadcast
# 출력된 MY_TOKEN_ADDRESS / MEME_VAULT_ADDRESS 를 backend/.env 에 넣기
```
배포한 지갑이 MemeVault의 owner가 되므로, 같은 키를 백엔드 `ADMIN_PRIVATE_KEY`로 사용합니다.

---

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # 값 채우기 (JWT_SECRET 필수)

# Database Setup
npx prisma db push

# Start Server (http://localhost:3000)
npm run start:dev

# Tests
npm test            # 단위 테스트 (src/core.spec.ts)
npm run test:e2e    # 전체 API 흐름 (임시 DB test/e2e.db 사용, 실제 토큰 전송 안 함)
```
- **처음 가입한 계정이 관리자**가 됩니다 (이벤트 생성·정산, 랭킹 초기화 가능). 다른 계정을 관리자로 바꾸려면 DB의 `users.is_admin`을 수정하세요.
- 기존 `dev.db`를 쓰고 있다면 `npx prisma db push --accept-data-loss`로 스키마를 갱신하세요 (닉네임 unique 제약 추가). 서버 시작 시 예전 SNS 제출·완료 퀘스트 데이터가 자동으로 보정됩니다. 예전 평문 비밀번호 계정은 처음 로그인할 때 해시로 바뀝니다.
- 업로드 이미지는 `backend/uploads/`에 저장되며 git에는 올리지 않습니다 (`backend/.gitignore`).

---

### 4. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env   # PORT=3001, REACT_APP_API_URL=http://localhost:3000
npm start              # http://localhost:3001
```

---

### 5. 🔐 Environment Variables
`backend/.env.example` 참고:

| 변수 | 설명 |
| :--- | :--- |
| `JWT_SECRET` | **필수.** 32자 이상 랜덤 문자열 |
| `FRONTEND_URL` | CORS 허용 및 지갑 로그인 메시지에 쓰이는 프론트 주소 (기본 `http://localhost:3001`, 쉼표로 여러 개 가능) |
| `RPC_URL`, `CHAIN_ID` | MemeCore RPC / 체인 ID |
| `ADMIN_PRIVATE_KEY` | 가스비를 내는 MemeVault owner 지갑 키 |
| `MY_TOKEN_ADDRESS`, `MEME_VAULT_ADDRESS` | 배포된 컨트랙트 주소 |
| `GEMINI_API_KEY` | Gemini API 키 |
| `YOUTUBE_API_KEY` | YouTube Data API v3 키 |
| `DATABASE_URL` | `file:./dev.db` |
| `PORT` | 선택. 백엔드 포트 (기본 3000, `.env.example`에는 없음) |
| `UPLOAD_DIR` | 선택. 업로드 저장 폴더 (기본 `backend/uploads`, `.env.example`에는 없음) |

배포 스크립트만 쓰는 선택 변수: `MAX_PAYOUT`, `INITIAL_FUNDING` (위 Smart Contracts 참고).

---

### 6. 🎥 Demo & Scenario
1. **Sign Up:** 아이디·비밀번호·닉네임과 보상 받을 지갑 주소(🦊 연결 버튼으로 MetaMask에서 가져오기)로 가입합니다. 이후엔 **지갑으로 로그인**도 가능합니다.
2. **Challenge:** AI 퀘스트를 생성하고 밈 이미지를 올리면 AI가 채점합니다.
3. **Viral:** 유튜브 영상 설명란에 내 고유 코드를 적고 링크를 제출하면 조회수에 따라 포인트를 받습니다.
4. **Event:** 테마 이벤트에 출품하고 좋아요를 받으면, 마감 후 Top 3가 상금을 받습니다.
5. **Swap:** "토큰 교환소"에서 포인트를 입력하면 $MQ 토큰이 지갑으로 전송됩니다.

---
