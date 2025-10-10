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

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout;
  }

  /**
   * 共通のfetchラッパー
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
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
        if (error.name === 'AbortError') {
          throw new Error('リクエストがタイムアウトしました');
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
const API_TIMEOUT = 10000; // 10秒

export const apiClient = new ApiClient({
  baseUrl: API_BASE_URL,
  timeout: API_TIMEOUT,
});