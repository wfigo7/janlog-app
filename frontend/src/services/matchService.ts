/**
 * 対局データ取得・操作サービス
 */
import { Match } from '../types/match';
import { GameMode } from '../types/common';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

export interface MatchFilters {
  mode?: GameMode;
  from?: string;
  to?: string;
}

export interface MatchListResponse {
  success: boolean;
  data: Match[];
  message?: string;
}

export class MatchService {
  /**
   * 対局履歴を取得
   */
  static async getMatches(filters: MatchFilters = {}): Promise<MatchListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.from) {
        params.append('from', filters.from);
      }
      
      if (filters.to) {
        params.append('to', filters.to);
      }
      
      if (filters.mode) {
        params.append('mode', filters.mode);
      }
      
      const url = `${API_BASE_URL}/matches?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data,
      };
      
    } catch (error) {
      console.error('対局履歴取得エラー:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : '対局履歴の取得に失敗しました',
      };
    }
  }
}