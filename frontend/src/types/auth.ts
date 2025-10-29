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
  confirmPassword?: string;  // UI用（バリデーションで使用）
}

/**
 * 初回パスワード設定用認証情報
 */
export interface InitialPasswordSetupCredentials {
  username: string;
  temporaryPassword: string;  // sessionから取得
  newPassword: string;
  session: string;
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
  details?: string[];  // パスワードポリシー違反の詳細など
}

/**
 * 認証Challenge情報
 */
export interface AuthChallenge {
  type: 'NEW_PASSWORD_REQUIRED';
  session: string;
  username: string;
}

/**
 * パスワードポリシー
 */
export const PASSWORD_POLICY = {
  minLength: 8,
  requireLowercase: true,
  requireUppercase: true,
  requireDigits: true,
  requireSymbols: false,
} as const;

/**
 * パスワードポリシーメッセージ
 */
export const PASSWORD_POLICY_MESSAGES = {
  minLength: '8文字以上',
  requireLowercase: '小文字を含む',
  requireUppercase: '大文字を含む',
  requireDigits: '数字を含む',
  requireSymbols: '記号を含む',
} as const;