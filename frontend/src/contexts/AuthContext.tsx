/**
 * 認証コンテキスト
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, User, LoginCredentials, ChangePasswordCredentials, AuthChallenge } from '../types/auth';
import { authService } from '../services/authService';

// 認証アクション
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_CHALLENGE'; payload: AuthChallenge }
  | { type: 'AUTH_CHALLENGE_COMPLETE' };

// 認証コンテキストの値
interface AuthContextValue extends AuthState {
  authChallenge: AuthChallenge | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (credentials: ChangePasswordCredentials) => Promise<void>;
  clearError: () => void;
  checkAuthState: () => Promise<void>;
  respondToChallenge: (
    newPassword: string,
    challengeParams?: { username: string; session: string }
  ) => Promise<void>;
  clearChallenge: () => void;
}

// 初期状態（拡張版）
interface ExtendedAuthState extends AuthState {
  authChallenge: AuthChallenge | null;
}

const initialState: ExtendedAuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true, // 初期化時はローディング状態
  error: null,
  authChallenge: null,
};

// リデューサー
function authReducer(state: ExtendedAuthState, action: AuthAction): ExtendedAuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        isLoading: false,
        error: null,
        authChallenge: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
        authChallenge: null,
      };
    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'AUTH_CHALLENGE':
      return {
        ...state,
        isLoading: false,
        authChallenge: action.payload,
        error: null,
      };
    case 'AUTH_CHALLENGE_COMPLETE':
      return {
        ...state,
        authChallenge: null,
      };
    default:
      return state;
  }
}

// コンテキスト作成
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// プロバイダーコンポーネント
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 初期化時に認証状態をチェック
  useEffect(() => {
    checkAuthState();
  }, []);

  /**
   * 認証状態をチェック
   */
  const checkAuthState = async () => {
    try {
      dispatch({ type: 'AUTH_START' });
      const user = await authService.getCurrentUser();

      if (user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    } catch (error) {
      console.error('Auth state check error:', error);
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  /**
   * ログイン
   */
  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'AUTH_START' });

      // authService.login()が環境に応じて適切な認証方式を選択
      const user = await authService.login(credentials);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error) {
      // Challengeエラーをチェック
      if ((error as any).message === 'CHALLENGE_REQUIRED' && (error as any).challenge) {
        const challenge = (error as any).challenge as AuthChallenge;
        dispatch({ type: 'AUTH_CHALLENGE', payload: challenge });
        // Challengeの場合はエラーをスローしない（LoginScreenで処理）
        return;
      }

      const errorMessage = error instanceof Error ? error.message : '認証に失敗しました';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  /**
   * ログアウト
   */
  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      // ログアウトエラーでも状態はクリア
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  /**
   * パスワード変更
   */
  const changePassword = async (credentials: ChangePasswordCredentials) => {
    try {
      await authService.changePassword(credentials);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'パスワード変更に失敗しました';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  /**
   * エラークリア
   */
  const clearError = () => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  /**
   * Challengeに応答（初回パスワード変更）
   */
  const respondToChallenge = async (
    newPassword: string,
    challengeParams?: { username: string; session: string }
  ) => {
    try {
      // パラメータが渡された場合はそれを使用、なければstateから取得
      const username = challengeParams?.username || state.authChallenge?.username;
      const session = challengeParams?.session || state.authChallenge?.session;

      if (!username || !session) {
        throw new Error('Challenge情報がありません');
      }

      dispatch({ type: 'AUTH_START' });

      const user = await authService.respondToNewPasswordChallenge({
        username,
        newPassword,
        session,
      });

      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      dispatch({ type: 'AUTH_CHALLENGE_COMPLETE' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'パスワード変更に失敗しました';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  /**
   * Challengeクリア
   */
  const clearChallenge = () => {
    dispatch({ type: 'AUTH_CHALLENGE_COMPLETE' });
  };

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    changePassword,
    clearError,
    checkAuthState,
    respondToChallenge,
    clearChallenge,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// カスタムフック
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}