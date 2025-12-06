import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }
  }

  async verifyMemeImage(imageBuffer: Buffer, questTitle: string) {
    try {
      this.logger.log(`👁️ Analyzing meme image for quest: "${questTitle}"...`);

      // [수정됨] 프롬프트 강화: 텍스트 캡처 방지
      const prompt = `
        You are a Meme Judge. 
        Evaluate if this image matches the meme theme: "${questTitle}".
        
        CRITICAL RULES:
        1. If the image is just a screenshot of text, a document, or the quest description itself, score it 0 and fail it.
        2. It must be a visual image or meme derived from the theme.
        
        Response MUST be a raw JSON object:
        { 
          "isPass": boolean, (true if score >= 70)
          "score": number, (0-100)
          "reason": "short comment in Korean" 
        }
      `;

      // 이미지 데이터를 Gemini가 이해하는 형식으로 변환
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg',
        },
      };

      // 텍스트 + 이미지 전송
      const result = await this.model.generateContent([prompt, imagePart]);
      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(text);

    } catch (error) {
      this.logger.error('❌ Vision AI Error', error);
      // 에러 나면 일단 통과시켜줌 (Fail-safe)
      return { isPass: true, score: 80, reason: "AI 분석 실패로 인한 자동 통과" };
    }
  }


  async verifySocialPost(imageBuffer: Buffer, userCode: string, platform: string) {
    try {
      this.logger.log(`📱 Verifying SNS screenshot for code: "${userCode}" on ${platform}...`);

      const prompt = `
        You are a Social Media Verifier.
        Analyze this screenshot.
        
        Check for 2 things:
        1. Is this a screenshot of a social media interface (YouTube, Instagram, TikTok, X)?
        2. Does the text in the image contain the exact user code: "${userCode}"?
        
        Response MUST be a raw JSON object:
        { 
          "isPass": boolean, (true ONLY if both conditions are met)
          "foundCode": boolean,
          "reason": "short comment in Korean" 
        }
      `;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg',
        },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(text);

    } catch (error) {
      this.logger.error('❌ Vision AI Error', error);
      // 에러 시 안전하게 실패 처리
      return { isPass: false, foundCode: false, reason: "AI 분석 실패" };
    }
  }


  async generateDailyQuest() {
    try {
      this.logger.log('🤖 Generating Daily Quest...');
      const prompt = `
        Generate a daily meme quest in Korean. Randomly choose ONE of these categories: - Everyday Relatability (Work/School) - Gaming - Pets - Relationships/Friendship - Denial of Reality - Sudden Problem Situations Then output ONLY this JSON structure: { "title": "...", "content": "...", "targetViews": 100, "rewardPoints": 50 } Do not include anything else.
      `;
      const result = await this.model.generateContent(prompt);
      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      
      const quest = JSON.parse(text);
      this.logger.log(`✨ Quest Created: ${quest.title}`);
      return quest;
    } catch (error) {
      this.logger.error('AI Error', error);
      return { title: "기본 퀘스트", content: "밈 업로드", rewardPoints: 10 };
    }
  }
}