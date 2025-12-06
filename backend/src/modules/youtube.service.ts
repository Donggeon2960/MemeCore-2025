import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private apiKey: string;

  constructor(private configService: ConfigService) {
    // [수정] 뒤에 || '' 를 붙여서, 만약 키가 없으면 빈 문자열을 넣도록 처리 (에러 해결)
    this.apiKey = this.configService.get<string>('YOUTUBE_API_KEY') || '';
  }

  // 1. 유튜브 URL에서 Video ID 추출 (정규식)
  private extractVideoId(url: string): string {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[7].length === 11) {
      return match[7];
    }
    throw new BadRequestException('올바르지 않은 유튜브 URL입니다.');
  }

  // 2. 유튜브 API로 통계 조회
  async getVideoStats(url: string) {
    if (!this.apiKey) {
      throw new BadRequestException('서버에 유튜브 API 키가 설정되지 않았습니다.');
    }

    const videoId = this.extractVideoId(url);
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${this.apiKey}`;

    try {
      this.logger.log(`🔍 Fetching YouTube stats for: ${videoId}`);
      const response = await axios.get(apiUrl);
      
      const items = response.data.items;
      if (!items || items.length === 0) {
        throw new BadRequestException('영상을 찾을 수 없습니다.');
      }

      const stats = items[0].statistics;
      
      // 필요한 데이터 추출
      return {
        viewCount: Number(stats.viewCount || 0),
        likeCount: Number(stats.likeCount || 0),
        commentCount: Number(stats.commentCount || 0),
        videoId: videoId
      };

    } catch (error) {
      this.logger.error('❌ YouTube API Error', error.message);
      throw new BadRequestException('유튜브 정보를 가져오는데 실패했습니다.');
    }
  }
}