/**
 * 認証関連の型定義
 */

/**
 * ユーザー情報
 */
export interface User {
  userId: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
}

/**
 * 認証状態
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * ログイン認証情報
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * サインアップ認証情報
 */
export interface SignUpCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * パスワード変更認証情報
 */
export interface ChangePasswordCredentials {
  oldPassword: string;
  newPassword: string;
}

/**
 * Cognito認証トークン
 */
export interface CognitoTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

/**
 * 認証エラー
 */
export interface AuthError {
  code: string;
  message: string;
}