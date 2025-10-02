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
  venueId?: string;
  rulesetId?: string;
  limit?: number;
  nextKey?: string;
}

export interface PaginationInfo {
  total: number;
  hasMore: boolean;
  nextKey?: string;
}

export interface MatchListResponse extends ApiResponse<Match[]> {
  pagination?: PaginationInfo;
}

export interface MatchCreateResponse extends ApiResponse<Match> { }

export interface MatchDetailResponse extends ApiResponse<Match> { }

export interface MatchUpdateResponse extends ApiResponse<Match> { }

export interface MatchDeleteResponse extends ApiResponse<void> { }

export class MatchService {
  /**
   * 対局を登録
   */
  static async createMatch(matchInput: MatchInput): Promise<MatchCreateResponse> {
    try {
      // MatchInputにはすでにdateフィールドが含まれているのでそのまま送信
      const result = await apiClient.post<MatchCreateResponse>('/matches', matchInput);

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

      if (filters.venueId) {
        params.venue_id = filters.venueId;
      }

      if (filters.rulesetId) {
        params.ruleset_id = filters.rulesetId;
      }

      if (filters.limit) {
        params.limit = filters.limit.toString();
      }

      if (filters.nextKey) {
        params.next_key = filters.nextKey;
      }

      const response = await apiClient.get<{
        success: boolean;
        data: Match[];
        pagination: PaginationInfo;
      }>('/matches', params);

      return {
        success: true,
        data: response.data,
        pagination: response.pagination,
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

  /**
   * 対局詳細を取得
   */
  static async getMatchById(matchId: string): Promise<MatchDetailResponse> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: Match;
      }>(`/matches/${matchId}`);

      return {
        success: true,
        data: response.data,
      };

    } catch (error) {
      console.error('対局詳細取得エラー:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '対局詳細の取得に失敗しました',
      };
    }
  }

  /**
   * 対局を更新
   */
  static async updateMatch(matchId: string, matchInput: MatchInput): Promise<MatchUpdateResponse> {
    try {
      const result = await apiClient.put<{
        success: boolean;
        data: Match;
        message: string;
      }>(`/matches/${matchId}`, matchInput);

      return {
        success: true,
        data: result.data,
        message: result.message,
      };

    } catch (error) {
      console.error('対局更新エラー:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '対局の更新に失敗しました',
      };
    }
  }

  /**
   * 対局を削除
   */
  static async deleteMatch(matchId: string): Promise<MatchDeleteResponse> {
    try {
      const result = await apiClient.delete<{
        success: boolean;
        message: string;
      }>(`/matches/${matchId}`);

      return {
        success: true,
        message: result.message,
      };

    } catch (error) {
      console.error('対局削除エラー:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '対局の削除に失敗しました',
      };
    }
  }
}