/**
 * API関連の共通型定義
 */

/**
 * 共通APIレスポンス型
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * APIエラー型
 */
export interface ApiError {
  detail?: string;
  message?: string;
}

/**
 * APIクライアント設定型
 */
export interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
}