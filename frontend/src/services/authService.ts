/**
 * 認証サービス - AWS Cognito SDK v3を使用
 */

import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  GetUserCommand,
  ChangePasswordCommand,
  GlobalSignOutCommand,
  AuthFlowType,
  ChallengeNameType,
} from '@aws-sdk/client-cognito-identity-provider';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import {
  User,
  LoginCredentials,
  ChangePasswordCredentials,
  CognitoTokens,
  AuthError,
  AuthChallenge,
  InitialPasswordSetupCredentials,
  PASSWORD_POLICY_MESSAGES,
} from '../types/auth';
import { MOCK_USERS, MockUser } from '../config/mockUsers';

// 環境設定
const COGNITO_REGION = process.env.EXPO_PUBLIC_COGNITO_REGION || 'ap-northeast-1';
const COGNITO_USER_POOL_ID = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID;
const COGNITO_CLIENT_ID = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID;
const AUTH_MODE = process.env.EXPO_PUBLIC_AUTH_MODE || 'mock';
const MOCK_JWT = process.env.EXPO_PUBLIC_MOCK_JWT;

// デバッグ用ログ
console.log('AuthService Environment Variables:');
console.log('EXPO_PUBLIC_ENV:', process.env.EXPO_PUBLIC_ENV);
console.log('AUTH_MODE:', AUTH_MODE);
console.log('COGNITO_REGION:', COGNITO_REGION);
console.log('COGNITO_USER_POOL_ID:', COGNITO_USER_POOL_ID);
console.log('COGNITO_CLIENT_ID:', COGNITO_CLIENT_ID);

// SecureStore キー
const ACCESS_TOKEN_KEY = 'janlog_access_token';
const ID_TOKEN_KEY = 'janlog_id_token';
const REFRESH_TOKEN_KEY = 'janlog_refresh_token';

/**
 * Cognito認証サービス
 */
class AuthService {
  private cognitoClient: CognitoIdentityProviderClient;

  constructor() {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: COGNITO_REGION,
    });
  }

  /**
   * ログイン（メインメソッド）
   */
  async login(credentials: LoginCredentials): Promise<User> {
    // local環境の場合はモック認証
    if (AUTH_MODE === 'mock') {
      return this.mockLogin(credentials);
    }

    // 本番環境では簡易ログインを使用
    return this.simpleLogin(credentials);
  }

  /**
   * 簡易ログイン（パスワード直接認証）
   * 注意: 本番環境では推奨されません。SRP認証を使用してください。
   */
  async simpleLogin(credentials: LoginCredentials): Promise<User> {
    console.log('SimpleLogin called with AUTH_MODE:', AUTH_MODE);
    console.log('Using Cognito authentication');
    console.log('COGNITO_CLIENT_ID:', COGNITO_CLIENT_ID);
    console.log('COGNITO_REGION:', COGNITO_REGION);

    try {
      if (!COGNITO_CLIENT_ID) {
        throw new Error('Cognito Client ID が設定されていません');
      }

      console.log('Creating InitiateAuthCommand...');
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: credentials.email,
          PASSWORD: credentials.password,
        },
      });

      console.log('Sending command to Cognito...');
      const response = await this.cognitoClient.send(command);
      console.log('Cognito response received:', response);

      // Challengeをチェック
      const challenge = this.handleAuthChallenge(response);
      if (challenge) {
        console.log('Challenge detected:', challenge.type);
        // ChallengeをエラーとしてスローしてAuthContextで処理
        const challengeError: any = new Error('CHALLENGE_REQUIRED');
        challengeError.challenge = challenge;
        throw challengeError;
      }

      if (response.AuthenticationResult) {
        console.log('Authentication successful, storing tokens...');
        const tokens: CognitoTokens = {
          accessToken: response.AuthenticationResult.AccessToken!,
          idToken: response.AuthenticationResult.IdToken!,
          refreshToken: response.AuthenticationResult.RefreshToken!,
        };

        await this.storeTokens(tokens);
        const user = await this.getUserFromTokens(tokens);
        console.log('User retrieved:', user);
        return user;
      }

      console.log('Authentication failed - no result');
      throw new Error('認証に失敗しました');
    } catch (error) {
      console.error('Simple login error:', error);
      // Challengeエラーはそのままスロー
      if ((error as any).message === 'CHALLENGE_REQUIRED') {
        throw error;
      }
      throw this.handleAuthError(error);
    }
  }

  /**
   * モックログイン（local環境用）
   * credentialsのemailをモックユーザーIDとして使用
   */
  private async mockLogin(credentials: LoginCredentials): Promise<User> {
    console.log('Mock login with userId:', credentials.email);
    
    // モックユーザーを検索
    const mockUser = MOCK_USERS.find(u => u.id === credentials.email);
    
    if (!mockUser) {
      throw new Error('モックユーザーが見つかりません');
    }

    // モックJWTを保存
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(ID_TOKEN_KEY, mockUser.jwt);
    } else {
      // Web環境ではsessionStorageを使用
      sessionStorage.setItem(ID_TOKEN_KEY, mockUser.jwt);
    }

    // モックユーザーを返す
    return {
      userId: mockUser.id,
      email: mockUser.email,
      displayName: mockUser.name,
      role: mockUser.role,
    };
  }

  /**
   * モックユーザー一覧を取得（local環境用）
   */
  getMockUsers(): MockUser[] {
    if (AUTH_MODE !== 'mock') {
      return [];
    }
    return MOCK_USERS;
  }

  /**
   * ログアウト
   */
  async logout(): Promise<void> {
    try {
      console.log('Starting logout process...');

      // Cognitoからグローバルサインアウト
      if (AUTH_MODE !== 'mock') {
        const accessToken = await this.getStoredAccessToken();
        if (accessToken) {
          console.log('Signing out from Cognito...');
          const command = new GlobalSignOutCommand({
            AccessToken: accessToken,
          });
          await this.cognitoClient.send(command);
          console.log('Cognito signout successful');
        }
      } else {
        console.log('Mock mode - skipping Cognito signout');
      }

      // ローカルトークンを削除
      console.log('Clearing stored tokens...');
      await this.clearStoredTokens();
      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // ログアウトエラーでもローカルトークンは削除
      console.log('Clearing tokens due to error...');
      await this.clearStoredTokens();
    }
  }

  /**
   * 強制ログアウト（デバッグ用）
   */
  async forceLogout(): Promise<void> {
    console.log('Force logout - clearing all tokens');
    await this.clearStoredTokens();
  }

  /**
   * 現在のユーザー情報を取得
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      console.log('Getting current user, AUTH_MODE:', AUTH_MODE);

      if (AUTH_MODE === 'mock') {
        let mockToken: string | null = null;
        
        if (Platform.OS !== 'web') {
          mockToken = await SecureStore.getItemAsync(ID_TOKEN_KEY);
        } else {
          mockToken = sessionStorage.getItem(ID_TOKEN_KEY);
        }

        console.log('Mock token exists:', !!mockToken);

        if (mockToken) {
          // JWTからユーザー情報を取得
          const mockUser = MOCK_USERS.find(u => u.jwt === mockToken);
          if (mockUser) {
            return {
              userId: mockUser.id,
              email: mockUser.email,
              displayName: mockUser.name,
              role: mockUser.role,
            };
          }
        }
        return null;
      }

      const accessToken = await this.getStoredAccessToken();
      console.log('Access token exists:', !!accessToken);

      if (!accessToken) {
        return null;
      }

      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const response = await this.cognitoClient.send(command);
      return this.parseUserFromCognitoResponse(response);
    } catch (error) {
      console.error('Get current user error:', error);
      // トークンが無効な場合はクリア
      await this.clearStoredTokens();
      return null;
    }
  }

  /**
   * パスワード変更
   */
  async changePassword(credentials: ChangePasswordCredentials): Promise<void> {
    if (AUTH_MODE === 'mock') {
      // モック環境では何もしない
      return;
    }

    try {
      const accessToken = await this.getStoredAccessToken();
      if (!accessToken) {
        throw new Error('認証が必要です');
      }

      const command = new ChangePasswordCommand({
        AccessToken: accessToken,
        PreviousPassword: credentials.oldPassword,
        ProposedPassword: credentials.newPassword,
      });

      await this.cognitoClient.send(command);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * NEW_PASSWORD_REQUIRED Challengeに応答
   */
  async respondToNewPasswordChallenge(params: {
    username: string;
    newPassword: string;
    session: string;
  }): Promise<User> {
    console.log('Responding to NEW_PASSWORD_REQUIRED challenge');

    try {
      if (!COGNITO_CLIENT_ID) {
        throw new Error('Cognito Client ID が設定されていません');
      }

      const command = new RespondToAuthChallengeCommand({
        ChallengeName: ChallengeNameType.NEW_PASSWORD_REQUIRED,
        ClientId: COGNITO_CLIENT_ID,
        ChallengeResponses: {
          USERNAME: params.username,
          NEW_PASSWORD: params.newPassword,
        },
        Session: params.session,
      });

      console.log('Sending RespondToAuthChallengeCommand...');
      const response = await this.cognitoClient.send(command);
      console.log('Challenge response received:', response);

      if (response.AuthenticationResult) {
        console.log('Challenge completed successfully, storing tokens...');
        const tokens: CognitoTokens = {
          accessToken: response.AuthenticationResult.AccessToken!,
          idToken: response.AuthenticationResult.IdToken!,
          refreshToken: response.AuthenticationResult.RefreshToken!,
        };

        await this.storeTokens(tokens);
        const user = await this.getUserFromTokens(tokens);
        console.log('User retrieved after challenge:', user);
        return user;
      }

      throw new Error('Challenge応答に失敗しました');
    } catch (error) {
      console.error('Respond to challenge error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 認証Challengeをハンドリング
   */
  handleAuthChallenge(response: any): AuthChallenge | null {
    if (response.ChallengeName === ChallengeNameType.NEW_PASSWORD_REQUIRED) {
      console.log('NEW_PASSWORD_REQUIRED challenge detected');
      return {
        type: 'NEW_PASSWORD_REQUIRED',
        session: response.Session || '',
        username: response.ChallengeParameters?.USER_ID_FOR_SRP || '',
      };
    }

    return null;
  }

  /**
   * 認証状態をチェック
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  /**
   * アクセストークンを取得（API呼び出し用）
   */
  async getAccessToken(): Promise<string | null> {
    if (AUTH_MODE === 'mock') {
      // mockモードでは保存されているトークンを返す
      if (Platform.OS !== 'web') {
        return await SecureStore.getItemAsync(ID_TOKEN_KEY);
      } else {
        return sessionStorage.getItem(ID_TOKEN_KEY);
      }
    }

    return await this.getStoredAccessToken();
  }

  // プライベートメソッド

  /**
   * トークンを安全に保存
   */
  private async storeTokens(tokens: CognitoTokens): Promise<void> {
    if (Platform.OS === 'web') {
      // Web環境ではsessionStorageを使用（開発用）
      // 注意: 本番環境ではより安全な方法を検討してください
      sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      sessionStorage.setItem(ID_TOKEN_KEY, tokens.idToken);
      sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      return;
    }

    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
      SecureStore.setItemAsync(ID_TOKEN_KEY, tokens.idToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
    ]);
  }

  /**
   * 保存されたアクセストークンを取得
   */
  private async getStoredAccessToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return sessionStorage.getItem(ACCESS_TOKEN_KEY);
    }

    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  }

  /**
   * 保存されたトークンをクリア
   */
  private async clearStoredTokens(): Promise<void> {
    if (Platform.OS === 'web') {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(ID_TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      return;
    }

    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch(() => { }),
      SecureStore.deleteItemAsync(ID_TOKEN_KEY).catch(() => { }),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => { }),
    ]);
  }

  /**
   * トークンからユーザー情報を取得
   */
  private async getUserFromTokens(tokens: CognitoTokens): Promise<User> {
    const command = new GetUserCommand({
      AccessToken: tokens.accessToken,
    });

    const response = await this.cognitoClient.send(command);
    return this.parseUserFromCognitoResponse(response);
  }

  /**
   * Cognitoレスポンスからユーザー情報をパース
   */
  private parseUserFromCognitoResponse(response: any): User {
    const attributes = response.UserAttributes || [];
    const getAttributeValue = (name: string) => {
      const attr = attributes.find((a: any) => a.Name === name);
      return attr?.Value || '';
    };

    return {
      userId: response.Username || '',
      email: getAttributeValue('email'),
      displayName: getAttributeValue('name') || getAttributeValue('email'),
      role: getAttributeValue('custom:role') === 'admin' ? 'admin' : 'user',
    };
  }

  /**
   * パスワードポリシー違反の詳細を抽出
   */
  private extractPasswordPolicyErrors(error: any): string[] {
    const errors: string[] = [];
    const message = error.message || '';

    if (message.includes('length')) {
      errors.push(PASSWORD_POLICY_MESSAGES.minLength);
    }
    if (message.includes('lowercase')) {
      errors.push(PASSWORD_POLICY_MESSAGES.requireLowercase);
    }
    if (message.includes('uppercase')) {
      errors.push(PASSWORD_POLICY_MESSAGES.requireUppercase);
    }
    if (message.includes('numeric') || message.includes('digit')) {
      errors.push(PASSWORD_POLICY_MESSAGES.requireDigits);
    }
    if (message.includes('symbol')) {
      errors.push(PASSWORD_POLICY_MESSAGES.requireSymbols);
    }

    return errors;
  }

  /**
   * 認証エラーをハンドリング
   */
  private handleAuthError(error: any): AuthError {
    if (error?.name) {
      switch (error.name) {
        case 'NotAuthorizedException':
          return { code: 'INVALID_CREDENTIALS', message: 'メールアドレスまたはパスワードが正しくありません' };
        case 'UserNotFoundException':
          return { code: 'USER_NOT_FOUND', message: 'ユーザーが見つかりません' };
        case 'UserNotConfirmedException':
          return { code: 'USER_NOT_CONFIRMED', message: 'ユーザーの確認が完了していません' };
        case 'PasswordResetRequiredException':
          return { code: 'PASSWORD_RESET_REQUIRED', message: 'パスワードのリセットが必要です' };
        case 'InvalidPasswordException':
          // パスワードポリシー違反の詳細を抽出
          const policyErrors = this.extractPasswordPolicyErrors(error);
          return {
            code: 'INVALID_PASSWORD',
            message: 'パスワードが要件を満たしていません',
            details: policyErrors.length > 0 ? policyErrors : undefined,
          };
        case 'LimitExceededException':
          return { code: 'LIMIT_EXCEEDED', message: 'パスワード変更の回数制限に達しました。しばらく待ってから再試行してください' };
        case 'TooManyRequestsException':
          return { code: 'TOO_MANY_REQUESTS', message: 'リクエストが多すぎます。しばらく待ってから再試行してください' };
        case 'InvalidParameterException':
          return { code: 'INVALID_PARAMETER', message: '無効なパラメータです' };
        default:
          return { code: 'UNKNOWN_ERROR', message: error.message || '認証エラーが発生しました' };
      }
    }

    return { code: 'UNKNOWN_ERROR', message: error.message || '認証エラーが発生しました' };
  }


}

export const authService = new AuthService();