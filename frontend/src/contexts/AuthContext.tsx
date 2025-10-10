/**
 * 認証コンテキスト
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, User, LoginCredentials, ChangePasswordCredentials } from '../types/auth';
import { authService } from '../services/authService';

// 認証アクション
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' };

// 認証コンテキストの値
interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (credentials: ChangePasswordCredentials) => Promise<void>;
  clearError: () => void;
  checkAuthState: () => Promise<void>;
}

// 初期状態
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true, // 初期化時はローディング状態
  error: null,
};

// リデューサー
function authReducer(state: AuthState, action: AuthAction): AuthState {
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
      };
    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
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
      console.log('Logout started...');
      await authService.logout();
      console.log('AuthService logout completed');
      dispatch({ type: 'AUTH_LOGOUT' });
      console.log('Auth state cleared');
    } catch (error) {
      console.error('Logout error:', error);
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

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    changePassword,
    clearError,
    checkAuthState,
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