/**
 * 認証ガードコンポーネント
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { LoginScreen } from './LoginScreen';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * 認証が必要なコンポーネントをラップするガード
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // ローディング中
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>認証状態を確認中...</Text>
      </View>
    );
  }

  // 未認証の場合はログイン画面を表示
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // 認証済みの場合は子コンポーネントを表示
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});