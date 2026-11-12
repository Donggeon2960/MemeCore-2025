import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

// SNS 보상 규칙 (등록 시 + 매일 자정 증가분 정산에 같이 사용)
export const SNS_BASE_REWARD = 300;
export const SNS_BONUS_MIN_VIEWS = 100;
// 1회 정산 보너스 상한: 금고(토큰 발행량)가 영상 하나에 털리지 않도록
export const SNS_BONUS_CAP = 10_000;
export const snsBonus = (views: number, likes: number) =>
  Math.min(
    SNS_BONUS_CAP,
    Math.floor(Math.max(0, views) * 0.5) + Math.max(0, likes) * 10,
  );

const YT_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
];

/** 유튜브 URL → 11자리 영상 ID. 유튜브 도메인이 아니거나 형식이 다르면 null */
export function extractVideoId(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase();
  if (!['http:', 'https:'].includes(u.protocol) || !YT_HOSTS.includes(host))
    return null;
  const id = host.endsWith('youtu.be')
    ? u.pathname.split('/')[1]
    : u.pathname === '/watch'
      ? u.searchParams.get('v')
      : u.pathname.match(/^\/(shorts|embed|live|v)\/([^/]+)/)?.[2];
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

const SNS_HOSTS: Record<string, string[]> = {
  Instagram: ['instagram.com'],
  TikTok: ['tiktok.com'],
  X: ['x.com', 'twitter.com'],
};

/** 유튜브 외 SNS URL 검증 + 정규화 (쿼리/해시 제거 → 같은 게시물 중복 제출 방지) */
export function normalizeSnsUrl(platform: string, raw: string): string {
  let u: URL | undefined;
  try {
    u = new URL(raw.trim());
  } catch {
    /* 아래에서 처리 */
  }
  const host = u?.hostname.toLowerCase() ?? '';
  const ok =
    u?.protocol === 'https:' &&
    (SNS_HOSTS[platform] ?? []).some(
      (h) => host === h || host.endsWith(`.${h}`),
    );
  if (!u || !ok)
    throw new BadRequestException(`올바른 ${platform} 게시물 URL이 아닙니다.`);
  return `https://${host}${u.pathname.replace(/\/+$/, '')}`;
}

type YtVideosResponse = {
  items?: {
    statistics?: { viewCount?: string; likeCount?: string };
    snippet?: { description?: string };
  }[];
};

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly apiKey: string;

  constructor(configService: ConfigService) {
    this.apiKey = configService.get<string>('YOUTUBE_API_KEY') || '';
  }

  // ponytail: 영상 1개당 API 1회. 제출이 많아지면 id 50개씩 묶어 조회 (쿼터 절약)
  async getVideoStats(videoId: string) {
    if (!this.apiKey)
      throw new ServiceUnavailableException(
        '서버에 유튜브 API 키가 설정되지 않았습니다.',
      );

    let data: YtVideosResponse;
    try {
      ({ data } = await axios.get<YtVideosResponse>(
        'https://www.googleapis.com/youtube/v3/videos',
        {
          params: { part: 'statistics,snippet', id: videoId, key: this.apiKey },
          timeout: 10_000,
        },
      ));
    } catch (error) {
      this.logger.error(`YouTube API Error: ${(error as Error).message}`);
      throw new ServiceUnavailableException(
        '유튜브 정보를 가져오는데 실패했습니다.',
      );
    }

    const video = data.items?.[0];
    if (!video)
      throw new BadRequestException(
        '영상을 찾을 수 없습니다. (비공개/삭제 여부 확인)',
      );
    return {
      viewCount: Number(video.statistics?.viewCount || 0),
      likeCount: Number(video.statistics?.likeCount || 0),
      description: video.snippet?.description ?? '',
    };
  }
}
