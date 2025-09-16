/**
 * 対局データ取得・操作サービス
 */
import { Match, MatchInput } from '../types/match';
import { GameMode } from '../types/common';
import { apiClient } from '../utils/apiClient';
import { ApiResponse } from '../types/api';

export interface MatchFilters {
  mode?: GameMode;
  from?: string;
  to?: string;
}

export interface MatchListResponse extends ApiResponse<Match[]> {}

export interface MatchCreateResponse extends ApiResponse<Match> {}

export class MatchService {
  /**
   * 対局を登録
   */
  static async createMatch(matchInput: MatchInput): Promise<MatchCreateResponse> {
    try {
      // 現在の日時をISO形式で設定
      const matchData = {
        ...matchInput,
        date: new Date().toISOString(),
      };

      const result = await apiClient.post<MatchCreateResponse>('/matches', matchData);
      
      return {
        success: true,
        data: result.data,
        message: result.message,
      };

    } catch (error) {
      console.error('対局登録エラー:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '対局の登録に失敗しました',
      };
    }
  }

  /**
   * 対局履歴を取得
   */
  static async getMatches(filters: MatchFilters = {}): Promise<MatchListResponse> {
    try {
      const params: Record<string, string> = {};
      
      if (filters.from) {
        params.from = filters.from;
      }
      
      if (filters.to) {
        params.to = filters.to;
      }
      
      if (filters.mode) {
        params.mode = filters.mode;
      }
      
      const data = await apiClient.get<Match[]>('/matches', params);
      
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