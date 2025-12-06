import { Controller, Get, Post, Body } from '@nestjs/common';
import { BlockchainService } from './modules/blockchain/blockchain.service';
import { AiService } from './modules/ai/ai.service';

@Controller()
export class AppController {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly aiService: AiService,
  ) {}

  @Get()
  getHello(): string {
    return 'Meme SocialFi Backend is Running! 🚀';
  }

  // 1. 블록체인 보상 테스트
  @Post('test-reward')
  async testReward(@Body() body: { address: string; amount: string }) {
    return this.blockchainService.rewardUser(body.address, body.amount);
  }

  // 2. AI 퀘스트 생성 테스트
  @Get('test-ai-quest')
  async testAiQuest() {
    return this.aiService.generateDailyQuest();
  }
}