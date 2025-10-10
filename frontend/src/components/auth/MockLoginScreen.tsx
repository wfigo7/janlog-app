/**
 * モックログイン画面（local環境専用）
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { MockUser } from '../../config/mockUsers';

export function MockLoginScreen() {
  const { login, isLoading } = useAuth();
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null);
  const mockUsers = authService.getMockUsers();

  /**
   * モックユーザーでログイン
   */
  const handleMockLogin = async (mockUser: MockUser) => {
    try {
      setSelectedUser(mockUser);
      // emailフィールドにユーザーIDを渡す
      await login({
        email: mockUser.id,
        password: 'mock', // パスワードは使用されない
      });
    } catch (error) {
      console.error('Mock login failed:', error);
      setSelectedUser(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>Janlog</Text>
            <Text style={styles.subtitle}>開発モード</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>LOCAL</Text>
            </View>
          </View>

          {/* 説明 */}
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              ローカル開発環境です。{'\n'}
              テストユーザーを選択してログインしてください。
            </Text>
          </View>

          {/* モックユーザー一覧 */}
          <View style={styles.userList}>
            <Text style={styles.sectionTitle}>テストユーザー</Text>
            {mockUsers.map((mockUser) => (
              <TouchableOpacity
                key={mockUser.id}
                style={[
                  styles.userCard,
                  selectedUser?.id === mockUser.id && styles.userCardSelected,
                ]}
                onPress={() => handleMockLogin(mockUser)}
                disabled={isLoading}
              >
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{mockUser.name}</Text>
                  <Text style={styles.userEmail}>{mockUser.email}</Text>
                </View>
                <View style={[
                  styles.roleBadge,
                  mockUser.role === 'admin' && styles.roleBadgeAdmin,
                ]}>
                  <Text style={[
                    styles.roleText,
                    mockUser.role === 'admin' && styles.roleTextAdmin,
                  ]}>
                    {mockUser.role === 'admin' ? '管理者' : 'ユーザー'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* ローディング表示 */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>ログイン中...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notice: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#ffb74d',
  },
  noticeText: {
    color: '#e65100',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  userList: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  userCardSelected: {
    borderColor: '#2196f3',
    backgroundColor: '#e3f2fd',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  roleBadge: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleBadgeAdmin: {
    backgroundColor: '#f44336',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  roleTextAdmin: {
    color: '#fff',
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});
