/**
 * 統計データ取得サービス
 */
import { StatsResponse, StatsFilters } from '../types/stats';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

export class StatsService {
  /**
   * 成績サマリを取得
   */
  static async getStatsSummary(filters: StatsFilters): Promise<StatsResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.from) {
        params.append('from', filters.from);
      }
      
      if (filters.to) {
        params.append('to', filters.to);
      }
      
      params.append('mode', filters.mode);
      
      const url = `${API_BASE_URL}/stats/summary?${params.toString()}`;
      
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
      return data;
      
    } catch (error) {
      console.error('統計データ取得エラー:', error);
      throw error;
    }
  }
}