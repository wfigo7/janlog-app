/**
 * アプリケーション設定
 */

// 環境変数から取得、デフォルトはローカル開発環境
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// その他の設定
export const APP_CONFIG = {
  // API設定
  API_TIMEOUT: 10000, // 10秒

  // UI設定
  DEFAULT_GAME_MODE: 'four' as const,

  // デバッグ設定
  DEBUG_MODE: __DEV__,
} as const;