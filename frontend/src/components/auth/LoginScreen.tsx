/**
 * ログイン画面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../types/auth';

export function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  /**
   * ログイン処理
   */
  const handleLogin = async () => {
    console.log('Login button pressed');
    console.log('Credentials:', { email: credentials.email, password: '***' });
    
    // バリデーション
    if (!credentials.email.trim()) {
      Alert.alert('エラー', 'メールアドレスを入力してください');
      return;
    }

    if (!credentials.password.trim()) {
      Alert.alert('エラー', 'パスワードを入力してください');
      return;
    }

    try {
      console.log('Starting login process...');
      clearError();
      await login(credentials);
      console.log('Login completed successfully');
    } catch (error) {
      console.error('Login failed:', error);
      // エラーはコンテキストで処理されるため、ここでは何もしない
    }
  };

  /**
   * 入力値変更
   */
  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // エラーをクリア
    if (error) {
      clearError();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* ロゴ・タイトル */}
          <View style={styles.header}>
            <Text style={styles.title}>Janlog</Text>
            <Text style={styles.subtitle}>麻雀成績管理アプリ</Text>
          </View>

          {/* エラーメッセージ */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ログインフォーム */}
          <View style={styles.form}>
            {/* メールアドレス */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>メールアドレス</Text>
              <TextInput
                style={styles.input}
                value={credentials.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="example@email.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* パスワード */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>パスワード</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={credentials.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  placeholder="パスワードを入力"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <Text style={styles.passwordToggleText}>
                    {showPassword ? '隠す' : '表示'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ログインボタン */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 注意事項 */}
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              このアプリは招待制です。{'\n'}
              アカウントをお持ちでない場合は、管理者にお問い合わせください。
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 40,
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
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 60,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 12,
    bottom: 12,
    justifyContent: 'center',
  },
  passwordToggleText: {
    color: '#2196f3',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#2196f3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  notice: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
  },
  noticeText: {
    color: '#1976d2',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});