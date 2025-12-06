# MemeCore-2025

# 🐸 MemeQuest: AI-Powered Viral SocialFi Platform on MemeCore

> **"Meme 2.0: Turn Your Viral Power into Real Value"** > AI 검증과 블록체인 보상을 결합하여, 밈의 창작(Creation)과 확산(Viral)을 투명하게 보상하는 SocialFi 플랫폼입니다.

## 💡 Introduction
**MemeQuest**는 MemeCore 생태계의 비전인 **'Viral Economy'**를 실현하기 위한 dApp입니다.  
사용자는 AI가 생성한 퀘스트에 맞춰 밈을 만들거나, SNS에 공유하여 바이럴을 일으키고, 그 기여도(조회수, 좋아요)에 따라 **Meme Vault**로부터 **$MQ 토큰**을 즉시 보상받습니다.

기존 Web3의 복잡한 진입 장벽(가스비, 서명)을 제거하기 위해 **Server-Managed Wallet (Gasless)** 구조를 도입하여 Web2 사용자 경험을 그대로 유지했습니다.

## 🚀 Key Features

### 1. 🤖 AI Meme Challenge (Vision AI)
- **Google Gemini Vision AI**를 활용하여 업로드된 이미지가 퀘스트 주제와 적합한지 자동으로 분석하고 점수를 매깁니다.
- 단순한 업로드가 아닌, 퀄리티 높은 2차 창작을 유도합니다.

### 2. 📢 SNS Viral Verification (OCR & API)
- 사용자가 유튜브, 인스타그램 등에 밈을 공유하면 **Gemini OCR**로 유저 코드를 식별합니다.
- **YouTube Data API**를 통해 영상의 **실시간 조회수와 좋아요 수**를 추적하고, 성과에 따른 추가 보너스를 자동으로 지급합니다.

### 3. 💸 Gasless Reward System
- 사용자는 복잡한 지갑 서명이나 가스비(MEME Coin)가 필요 없습니다.
- 백엔드 서버(Admin Wallet)가 트랜잭션 비용을 대납하고, **Meme Vault** 스마트 컨트랙트를 통해 안전하게 토큰을 전송합니다.

### 4. 🏆 SocialFi Ranking & Vault
- 매주 초기화되는 랭킹 시스템을 통해 경쟁 심리를 자극합니다.
- 특정 이벤트 퀘스트의 Top 3에게는 **배치 전송(Batch Transfer)** 기능을 통해 대량의 상금을 일괄 지급합니다.

---

## ⛓️ Smart Contracts (MemeCore Testnet: Insectarium)

| Contract | Address | Description |
| :--- | :--- | :--- |
| **MemeVault** | `0xAb23A91875af8Aebd72893f2EaFc3e1c20F37D55` | 보상 재원을 보관하고 분배하는 금고 컨트랙트 |
| **MyToken ($MQ)** | `0xB78823C6733845b8619c796a9354de58F590fAC6` | 생태계 내에서 사용되는 유틸리티 토큰 (MRC-20) |

- **Network:** MemeCore Insectarium Testnet
- **Chain ID:** 43522
- **RPC URL:** `https://rpc.insectarium.memecore.net`

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19
- **Styling:** CSS Modules (Dark Theme)
- **Interaction:** REST API (Fetch)

### Backend
- **Framework:** NestJS (Node.js)
- **Database:** SQLite + Prisma ORM
- **AI Integration:** Google Generative AI SDK (Gemini 1.5 Flash)
- **Blockchain:** Ethers.js v6
- **Scheduling:** NestJS Schedule (Cron Jobs for Viral Bonus)

### Blockchain
- **Language:** Solidity ^0.8.20
- **Framework:** Foundry
- **Standard:** ERC-20 (OpenZeppelin), Ownable

---

## ⚡ Getting Started

### 1. Clone the repository
```bash
git clone [https://github.com/YOUR-GITHUB-ID/MemeQuest.git](https://github.com/YOUR-GITHUB-ID/MemeQuest.git)
cd MemeQuest
```

---

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
# (See Environment Variables section below)

# Database Setup
npx prisma db push
npx prisma generate

# Start Server
npm run start:dev
```

---

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

---

### 4.🔐 Environment Variables (.env)
- Create a .env file in the backend directory with the following configurations:
``` code
# --- Blockchain Config ---
RPC_URL="[https://rpc.insectarium.memecore.net](https://rpc.insectarium.memecore.net)"
CHAIN_ID=43522
# Admin Wallet Private Key (Gas Payer)
ADMIN_PRIVATE_KEY="YOUR_PRIVATE_KEY_HERE"

# Contract Addresses
MY_TOKEN_ADDRESS="YOUR_TOKEN_CONTRACT_ADDRESS"
MEME_VAULT_ADDRESS="YOUR_VAULT_CONTRACT_ADDRESS"

# --- AI Config ---
GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"

# --- External API ---
YOUTUBE_API_KEY="YOUR_YOUTUBE_DATA_API_KEY"

# --- Database ---
DATABASE_URL="file:./dev.db"
```

---

### 5. 🎥 Demo & Scenario
Sign Up: Create an account (Auto-generated wallet address linkage).

Challenge: Upload a meme image for "Pepe Challenge". AI scores it.

Viral: Upload a YouTube link. System checks view counts and rewards points.

Swap: Go to "Exchange" tab, enter points. Tokens arrive in MetaMask instantly.

---

### 6. 
