/**
 * 共通APIクライアント
 */

import { ApiError, ApiClientConfig } from '../types/api';
import { authService } from '../services/authService';

/**
 * 共通APIクライアント
 */
export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number = 2; // 最大リトライ回数
  private retryDelay: number = 1000; // リトライ間隔（ミリ秒）

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout;
  }

  /**
   * リトライ可能なエラーかどうかを判定
   */
  private isRetryableError(error: Error): boolean {
    // タイムアウトエラーやネットワークエラーはリトライ対象
    return error.name === 'AbortError' || 
           error.message.includes('タイムアウト') ||
           error.message.includes('Network request failed') ||
           error.message.includes('Failed to fetch');
  }

  /**
   * 指定時間待機
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 共通のfetchラッパー（リトライ機能付き）
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    // 認証トークンを取得
    const accessToken = await authService.getAccessToken();
    
    // 常に /api/v1 プレフィックスを追加（認証必須）
    // ただし /health エンドポイントは例外
    const apiEndpoint = endpoint === '/health' ? endpoint : `/api/v1${endpoint}`;
    const url = `${this.baseUrl}${apiEndpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };

      // 認証トークンを常に送信（モックまたは実JWT）
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      } else {
        // トークンがない場合はエラー
        throw new Error('認証トークンが取得できません。再度ログインしてください。');
      }

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // 401エラーの場合は認証エラーとして処理
        if (response.status === 401) {
          throw new Error('認証が必要です。再度ログインしてください。');
        }

        const errorData: ApiError = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        // タイムアウトエラーの場合
        if (error.name === 'AbortError') {
          const timeoutError = new Error('リクエストがタイムアウトしました');
          
          // リトライ可能な場合はリトライ
          if (retryCount < this.maxRetries) {
            console.log(`リトライ ${retryCount + 1}/${this.maxRetries}: ${endpoint}`);
            await this.sleep(this.retryDelay * (retryCount + 1)); // 指数バックオフ
            return this.request<T>(endpoint, options, retryCount + 1);
          }
          
          throw timeoutError;
        }

        // その他のリトライ可能なエラー
        if (this.isRetryableError(error) && retryCount < this.maxRetries) {
          console.log(`リトライ ${retryCount + 1}/${this.maxRetries}: ${endpoint} (${error.message})`);
          await this.sleep(this.retryDelay * (retryCount + 1));
          return this.request<T>(endpoint, options, retryCount + 1);
        }

        throw error;
      }

      throw new Error('不明なエラーが発生しました');
    }
  }

  /**
   * GETリクエスト
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;

    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POSTリクエスト
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUTリクエスト
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETEリクエスト
   */
  async delete<T>(endpoint: string): Promise<T> {
    console.log(`DELETE request to: ${this.baseUrl}${endpoint}`);
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// デフォルトのAPIクライアントインスタンス
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const API_TIMEOUT = 30000; // 30秒（コールドスタート + ネットワーク遅延を考慮）

export const apiClient = new ApiClient({
  baseUrl: API_BASE_URL,
  timeout: API_TIMEOUT,
});