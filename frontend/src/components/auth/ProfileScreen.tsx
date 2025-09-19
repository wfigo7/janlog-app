/**
 * プロフィール画面
 */

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { useCustomAlert } from '../../hooks/useCustomAlert';

export function ProfileScreen() {
    const { user, logout, isLoading, checkAuthState } = useAuth();
    const { showAlert, AlertComponent } = useCustomAlert();

    /**
     * ログアウト確認
     */
    const handleLogout = () => {
        console.log('Logout button pressed');
        showAlert({
            title: 'ログアウト',
            message: 'ログアウトしますか？',
            buttons: [
                {
                    text: 'キャンセル',
                    style: 'cancel',
                },
                {
                    text: 'ログアウト',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            console.log('Calling logout directly...');
                            await logout();
                            console.log('Logout completed successfully');
                        } catch (error) {
                            console.error('Logout failed:', error);
                            showAlert({
                                title: 'エラー',
                                message: 'ログアウトに失敗しました',
                            });
                        }
                    },
                },
            ],
        });
    };

    /**
     * 強制ログアウト（デバッグ用）
     */
    const handleForceLogout = () => {
        Alert.alert(
            '強制ログアウト',
            'すべてのトークンを削除してログアウトします。',
            [
                {
                    text: 'キャンセル',
                    style: 'cancel',
                },
                {
                    text: '強制ログアウト',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authService.logout();
                            // 認証状態を再チェック
                            await checkAuthState();
                        } catch (error) {
                            Alert.alert('エラー', '強制ログアウトに失敗しました');
                        }
                    },
                },
            ]
        );
    };

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>ユーザー情報を取得できませんでした</Text>
            </View>
        );
    }

    return (
        <>
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    {/* ユーザー情報 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>ユーザー情報</Text>

                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>表示名</Text>
                            <Text style={styles.infoValue}>{user.displayName}</Text>
                        </View>

                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>メールアドレス</Text>
                            <Text style={styles.infoValue}>{user.email}</Text>
                        </View>

                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>ユーザーID</Text>
                            <Text style={styles.infoValue}>{user.userId}</Text>
                        </View>

                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>権限</Text>
                            <Text style={styles.infoValue}>
                                {user.role === 'admin' ? '管理者' : '一般ユーザー'}
                            </Text>
                        </View>
                    </View>

                    {/* アクション */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>アカウント</Text>

                        {/* Alert テスト用ボタン */}
                        <TouchableOpacity
                            style={[styles.logoutButton, { backgroundColor: '#2196f3', marginBottom: 10 }]}
                            onPress={() => {
                                console.log('Custom Alert test button pressed');
                                showAlert({
                                    title: 'テスト',
                                    message: 'カスタムアラートは正常に動作しています！',
                                });
                            }}
                        >
                            <Text style={styles.logoutButtonText}>カスタムAlert テスト</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={handleLogout}
                            disabled={isLoading}
                        >
                            <Text style={styles.logoutButtonText}>
                                {isLoading ? 'ログアウト中...' : 'ログアウト'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.forceLogoutButton}
                            onPress={handleForceLogout}
                            disabled={isLoading}
                        >
                            <Text style={styles.forceLogoutButtonText}>
                                強制ログアウト（デバッグ用）
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* アプリ情報 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>アプリ情報</Text>

                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>アプリ名</Text>
                            <Text style={styles.infoValue}>Janlog</Text>
                        </View>

                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>バージョン</Text>
                            <Text style={styles.infoValue}>1.0.0</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
            <AlertComponent />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 20,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    infoLabel: {
        fontSize: 16,
        color: '#666',
        flex: 1,
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        flex: 2,
        textAlign: 'right',
    },
    logoutButton: {
        backgroundColor: '#f44336',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    forceLogoutButton: {
        backgroundColor: '#ff9800',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    forceLogoutButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 16,
        color: '#f44336',
        textAlign: 'center',
        marginTop: 20,
    },
});