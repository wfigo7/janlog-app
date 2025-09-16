/**
 * 統計データ取得サービス
 */
import { StatsResponse, StatsFilters } from '../types/stats';
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
      
      return await apiClient.get<StatsResponse>('/stats/summary', params);
      
    } catch (error) {
      console.error('統計データ取得エラー:', error);
      throw error;
    }
  }
}