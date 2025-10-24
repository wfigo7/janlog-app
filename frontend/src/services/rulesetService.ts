/**
 * ルールセット関連のAPIサービス
 */

import { apiClient } from '../utils/apiClient';
import {
  Ruleset,
  RulesetListResponse,
  PointCalculationRequest,
  PointCalculationResponse,
  RuleTemplateResponse
} from '../types/ruleset';

class RulesetService {
  /**
   * ルールセット一覧を取得
   */
  async getRulesets(): Promise<Ruleset[]> {
    try {
      const response = await apiClient.get<{ success: boolean; data: Ruleset[] }>('/rulesets');
      return response.data;
    } catch (error) {
      console.error('ルールセット一覧取得エラー:', error);
      throw new Error('ルールセット一覧の取得に失敗しました');
    }
  }

  /**
   * 特定のルールセットを取得
   */
  async getRuleset(rulesetId: string): Promise<Ruleset> {
    try {
      const result = await apiClient.get<{ success: boolean; data: Ruleset }>(`/rulesets/${rulesetId}`);
      return result.data;
    } catch (error) {
      console.error('ルールセット取得エラー:', error);
      throw new Error('ルールセットの取得に失敗しました');
    }
  }

  /**
   * ルールセットを作成
   */
  async createRuleset(ruleset: Omit<Ruleset, 'rulesetId' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<Ruleset> {
    try {
      const result = await apiClient.post<{ success: boolean; message: string; data: Ruleset }>('/rulesets', ruleset);
      return result.data;
    } catch (error) {
      console.error('ルールセット作成エラー:', error);
      throw new Error('ルールセットの作成に失敗しました');
    }
  }

  /**
   * ルールセットを更新
   */
  async updateRuleset(rulesetId: string, ruleset: Omit<Ruleset, 'rulesetId' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<Ruleset> {
    try {
      const result = await apiClient.put<{ success: boolean; message: string; data: Ruleset }>(`/rulesets/${rulesetId}`, ruleset);
      return result.data;
    } catch (error) {
      console.error('ルールセット更新エラー:', error);
      throw new Error('ルールセットの更新に失敗しました');
    }
  }

  /**
   * ルールセットを削除
   */
  async deleteRuleset(rulesetId: string): Promise<void> {
    try {
      await apiClient.delete<{ success: boolean; message: string }>(`/rulesets/${rulesetId}`);
    } catch (error) {
      console.error('ルールセット削除エラー:', error);
      throw new Error('ルールセットの削除に失敗しました');
    }
  }

  /**
   * ポイント計算を実行
   */
  async calculatePoints(request: PointCalculationRequest): Promise<PointCalculationResponse> {
    try {
      return await apiClient.post<PointCalculationResponse>('/rulesets/calculate', request);
    } catch (error) {
      console.error('ポイント計算エラー:', error);
      throw new Error('ポイント計算に失敗しました');
    }
  }

  /**
   * ルールテンプレート一覧を取得
   */
  async getRuleTemplates(): Promise<RuleTemplateResponse> {
    try {
      return await apiClient.get<RuleTemplateResponse>('/rulesets-templates');
    } catch (error) {
      console.error('ルールテンプレート取得エラー:', error);
      throw new Error('ルールテンプレートの取得に失敗しました');
    }
  }

  /**
   * ゲームモードでルールセットをフィルタリング
   */
  filterRulesetsByGameMode(rulesets: Ruleset[], gameMode: 'three' | 'four'): Ruleset[] {
    return rulesets.filter(ruleset => ruleset.gameMode === gameMode);
  }

  /**
   * ルールセットを表示用にフォーマット
   */
  formatRulesetForDisplay(ruleset: Ruleset): string {
    const umaStr = ruleset.uma.join('/');
    return `${ruleset.ruleName} (ウマ:${umaStr}, オカ:${ruleset.oka})`;
  }
}

export const rulesetService = new RulesetService();