/**
 * 認証ガードコンポーネント
 */

import React, { ReactNode, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, useSegments } from 'expo-router';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * 認証が必要なコンポーネントをラップするガード
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, authChallenge } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthFlow = segments[0] === 'login' || segments[0] === 'change-password';

    // Challenge状態の場合は何もしない（LoginScreenがナビゲーションを処理）
    if (authChallenge) return;

    // 未認証でauth flow以外にいる場合はログイン画面にリダイレクト
    if (!isAuthenticated && !inAuthFlow) {
      router.replace('/login');
      return;
    }

    // 認証済みでログイン画面にいる場合はホーム画面にリダイレクト
    if (isAuthenticated && segments[0] === 'login') {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, authChallenge, segments, router]);

  // ローディング中
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>認証状態を確認中...</Text>
      </View>
    );
  }

  // 子コンポーネントを表示
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