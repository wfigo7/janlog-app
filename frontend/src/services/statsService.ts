/**
 * 統計データ取得サービス
 */
import { StatsResponse, StatsFilters, ChartDataResponse } from '../types/stats';
import { apiClient } from '../utils/apiClient';

export class StatsService {
  /**
   * 成績サマリを取得
   */
  static async getStatsSummary(filters: StatsFilters): Promise<StatsResponse> {
    try {
      const params: Record<string, string> = {
        mode: filters.mode,
      };
      
      if (filters.from) {
        params.from = filters.from;
      }
      
      if (filters.to) {
        params.to = filters.to;
      }

      if (filters.venueId) {
        params.venue_id = filters.venueId;
      }

      if (filters.rulesetId) {
        params.ruleset_id = filters.rulesetId;
      }

      if (filters.matchType) {
        params.match_type = filters.matchType;
      }
      
      const response = await apiClient.get<StatsResponse>('/stats/summary', params);
      return {
        success: true,
        data: response.data,
      };
      
    } catch (error) {
      console.error('統計データ取得エラー:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '統計データの取得に失敗しました',
      };
    }
  }

  /**
   * チャート用データを取得
   */
  static async getChartData(filters: StatsFilters): Promise<ChartDataResponse> {
    try {
      const params: Record<string, string> = {
        mode: filters.mode,
      };
      
      if (filters.from) {
        params.from = filters.from;
      }
      
      if (filters.to) {
        params.to = filters.to;
      }

      if (filters.venueId) {
        params.venue_id = filters.venueId;
      }

      if (filters.rulesetId) {
        params.ruleset_id = filters.rulesetId;
      }

      if (filters.matchType) {
        params.match_type = filters.matchType;
      }
      
      const response = await apiClient.get<ChartDataResponse>('/stats/chart-data', params);
      return {
        success: true,
        data: response.data,
      };
      
    } catch (error) {
      console.error('チャートデータ取得エラー:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'チャートデータの取得に失敗しました',
      };
    }
  }
}