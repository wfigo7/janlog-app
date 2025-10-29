/**
 * パスワード変更画面
 * 初回パスワード変更と通常のパスワード変更の両方に対応
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { PASSWORD_POLICY, PASSWORD_POLICY_MESSAGES } from '../../types/auth';

// ナビゲーション型定義
interface ChangePasswordScreenProps {
    route: {
        params?: {
            isInitialSetup?: boolean;
            session?: string;
            username?: string;
        };
    };
    navigation: {
        goBack: () => void;
    };
}

// State型定義
interface ChangePasswordState {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    showCurrentPassword: boolean;
    showNewPassword: boolean;
    showConfirmPassword: boolean;
    isLoading: boolean;
    errors: {
        currentPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
    };
}

export function ChangePasswordScreen({ route, navigation }: ChangePasswordScreenProps) {
    const router = useRouter();
    const { changePassword, respondToChallenge } = useAuth();
    const { showAlert, AlertComponent } = useCustomAlert();

    // 初回セットアップモードかどうか
    const isInitialSetup = route.params?.isInitialSetup || false;

    // State
    const [state, setState] = useState<ChangePasswordState>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrentPassword: false,
        showNewPassword: false,
        showConfirmPassword: false,
        isLoading: false,
        errors: {},
    });

    /**
     * パスワードポリシーチェック
     */
    const checkPasswordPolicy = (password: string): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (password.length < PASSWORD_POLICY.minLength) {
            errors.push(PASSWORD_POLICY_MESSAGES.minLength);
        }
        if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
            errors.push(PASSWORD_POLICY_MESSAGES.requireLowercase);
        }
        if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push(PASSWORD_POLICY_MESSAGES.requireUppercase);
        }
        if (PASSWORD_POLICY.requireDigits && !/\d/.test(password)) {
            errors.push(PASSWORD_POLICY_MESSAGES.requireDigits);
        }
        if (PASSWORD_POLICY.requireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push(PASSWORD_POLICY_MESSAGES.requireSymbols);
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    };

    /**
     * バリデーション
     */
    const validatePasswords = (): boolean => {
        const newErrors: ChangePasswordState['errors'] = {};

        // 通常モードの場合、現在のパスワードをチェック
        if (!isInitialSetup && !state.currentPassword.trim()) {
            newErrors.currentPassword = '現在のパスワードを入力してください';
        }

        // 新しいパスワードをチェック
        if (!state.newPassword.trim()) {
            newErrors.newPassword = '新しいパスワードを入力してください';
        } else {
            const policyCheck = checkPasswordPolicy(state.newPassword);
            if (!policyCheck.isValid) {
                newErrors.newPassword = `パスワード要件を満たしていません:\n${policyCheck.errors.join('\n')}`;
            }
        }

        // 確認パスワードをチェック
        if (!state.confirmPassword.trim()) {
            newErrors.confirmPassword = '確認パスワードを入力してください';
        } else if (state.newPassword !== state.confirmPassword) {
            newErrors.confirmPassword = 'パスワードが一致しません';
        }

        // 通常モードの場合、新しいパスワードが現在のパスワードと同じかチェック
        if (!isInitialSetup && state.newPassword === state.currentPassword) {
            newErrors.newPassword = '新しいパスワードは現在のパスワードと異なる必要があります';
        }

        setState((prev) => ({ ...prev, errors: newErrors }));
        return Object.keys(newErrors).length === 0;
    };

    /**
     * パスワード変更処理
     */
    const handleChangePassword = async () => {
        // バリデーション
        if (!validatePasswords()) {
            return;
        }

        setState((prev) => ({ ...prev, isLoading: true }));

        try {
            if (isInitialSetup) {
                // 初回パスワード変更（Challenge応答）
                // ルートパラメータからsessionとusernameを取得
                const session = route.params?.session;
                const username = route.params?.username;

                if (!session || !username) {
                    throw new Error('Challenge情報が不足しています');
                }

                await respondToChallenge(state.newPassword, { username, session });

                showAlert({
                    title: '成功',
                    message: 'パスワードを設定しました',
                    buttons: [
                        {
                            text: 'OK',
                            onPress: () => {
                                router.replace('/(tabs)');
                            },
                        },
                    ],
                });
            } else {
                // 通常のパスワード変更
                await changePassword({
                    oldPassword: state.currentPassword,
                    newPassword: state.newPassword,
                });

                showAlert({
                    title: '成功',
                    message: 'パスワードを変更しました',
                    buttons: [
                        {
                            text: 'OK',
                            onPress: () => {
                                navigation.goBack();
                            },
                        },
                    ],
                });
            }
        } catch (error) {
            handleError(error);
        } finally {
            setState((prev) => ({ ...prev, isLoading: false }));
        }
    };

    /**
     * エラーハンドリング
     */
    const handleError = (error: any) => {
        let errorMessage: string;

        // AuthErrorオブジェクトの場合（AuthServiceから返される）
        if (error?.code) {
            switch (error.code) {
                case 'INVALID_CREDENTIALS':
                    errorMessage = isInitialSetup
                        ? 'セッションの有効期限が切れました。再度ログインしてください。'
                        : '現在のパスワードが正しくありません。';
                    break;

                case 'INVALID_PASSWORD':
                    errorMessage = 'パスワードが要件を満たしていません。';
                    if (error.details && error.details.length > 0) {
                        errorMessage += '\n' + error.details.join('\n');
                    }
                    break;

                case 'LIMIT_EXCEEDED':
                    errorMessage = 'パスワード変更の回数制限に達しました。しばらく待ってから再試行してください。';
                    break;

                case 'TOO_MANY_REQUESTS':
                    errorMessage = 'リクエストが多すぎます。しばらく待ってから再試行してください。';
                    break;

                default:
                    errorMessage = error.message || 'パスワード変更に失敗しました。';
            }
        } else if (error?.name) {
            // 生のCognitoエラーの場合
            switch (error.name) {
                case 'NotAuthorizedException':
                    errorMessage = isInitialSetup
                        ? 'セッションの有効期限が切れました。再度ログインしてください。'
                        : '現在のパスワードが正しくありません。';
                    break;

                case 'InvalidPasswordException':
                    errorMessage = 'パスワードが要件を満たしていません。';
                    break;

                case 'LimitExceededException':
                    errorMessage = 'パスワード変更の回数制限に達しました。しばらく待ってから再試行してください。';
                    break;

                case 'TooManyRequestsException':
                    errorMessage = 'リクエストが多すぎます。しばらく待ってから再試行してください。';
                    break;

                default:
                    errorMessage = 'パスワード変更に失敗しました。';
            }
        } else {
            errorMessage = error.message || 'パスワード変更に失敗しました。';
        }

        showAlert({
            title: 'エラー',
            message: errorMessage,
        });
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
                    {/* ヘッダー */}
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {isInitialSetup ? '初回パスワード設定' : 'パスワード変更'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {isInitialSetup
                                ? '新しいパスワードを設定してください'
                                : '現在のパスワードと新しいパスワードを入力してください'}
                        </Text>
                    </View>

                    {/* パスワードポリシー表示 */}
                    <View style={styles.policyContainer}>
                        <Text style={styles.policyTitle}>パスワード要件</Text>
                        <Text style={styles.policyItem}>• {PASSWORD_POLICY_MESSAGES.minLength}</Text>
                        <Text style={styles.policyItem}>• {PASSWORD_POLICY_MESSAGES.requireLowercase}</Text>
                        <Text style={styles.policyItem}>• {PASSWORD_POLICY_MESSAGES.requireUppercase}</Text>
                        <Text style={styles.policyItem}>• {PASSWORD_POLICY_MESSAGES.requireDigits}</Text>
                    </View>

                    {/* フォーム */}
                    <View style={styles.form}>
                        {/* 現在のパスワード（通常モードのみ） */}
                        {!isInitialSetup && (
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>現在のパスワード</Text>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={[styles.input, styles.passwordInput]}
                                        value={state.currentPassword}
                                        onChangeText={(value) =>
                                            setState((prev) => ({
                                                ...prev,
                                                currentPassword: value,
                                                errors: { ...prev.errors, currentPassword: undefined },
                                            }))
                                        }
                                        placeholder="現在のパスワードを入力"
                                        placeholderTextColor="#999"
                                        secureTextEntry={!state.showCurrentPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!state.isLoading}
                                    />
                                    <TouchableOpacity
                                        style={styles.passwordToggle}
                                        onPress={() =>
                                            setState((prev) => ({
                                                ...prev,
                                                showCurrentPassword: !prev.showCurrentPassword,
                                            }))
                                        }
                                        disabled={state.isLoading}
                                    >
                                        <Text style={styles.passwordToggleText}>
                                            {state.showCurrentPassword ? '隠す' : '表示'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                {state.errors.currentPassword && (
                                    <Text style={styles.errorText}>{state.errors.currentPassword}</Text>
                                )}
                            </View>
                        )}

                        {/* 新しいパスワード */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>新しいパスワード</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.input, styles.passwordInput]}
                                    value={state.newPassword}
                                    onChangeText={(value) =>
                                        setState((prev) => ({
                                            ...prev,
                                            newPassword: value,
                                            errors: { ...prev.errors, newPassword: undefined },
                                        }))
                                    }
                                    placeholder="新しいパスワードを入力"
                                    placeholderTextColor="#999"
                                    secureTextEntry={!state.showNewPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!state.isLoading}
                                />
                                <TouchableOpacity
                                    style={styles.passwordToggle}
                                    onPress={() =>
                                        setState((prev) => ({
                                            ...prev,
                                            showNewPassword: !prev.showNewPassword,
                                        }))
                                    }
                                    disabled={state.isLoading}
                                >
                                    <Text style={styles.passwordToggleText}>
                                        {state.showNewPassword ? '隠す' : '表示'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {state.errors.newPassword && (
                                <Text style={styles.errorText}>{state.errors.newPassword}</Text>
                            )}
                        </View>

                        {/* 新しいパスワード（確認） */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>新しいパスワード（確認）</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.input, styles.passwordInput]}
                                    value={state.confirmPassword}
                                    onChangeText={(value) =>
                                        setState((prev) => ({
                                            ...prev,
                                            confirmPassword: value,
                                            errors: { ...prev.errors, confirmPassword: undefined },
                                        }))
                                    }
                                    placeholder="新しいパスワードを再入力"
                                    placeholderTextColor="#999"
                                    secureTextEntry={!state.showConfirmPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!state.isLoading}
                                />
                                <TouchableOpacity
                                    style={styles.passwordToggle}
                                    onPress={() =>
                                        setState((prev) => ({
                                            ...prev,
                                            showConfirmPassword: !prev.showConfirmPassword,
                                        }))
                                    }
                                    disabled={state.isLoading}
                                >
                                    <Text style={styles.passwordToggleText}>
                                        {state.showConfirmPassword ? '隠す' : '表示'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {state.errors.confirmPassword && (
                                <Text style={styles.errorText}>{state.errors.confirmPassword}</Text>
                            )}
                        </View>

                        {/* 変更ボタン */}
                        <TouchableOpacity
                            style={[styles.submitButton, state.isLoading && styles.submitButtonDisabled]}
                            onPress={handleChangePassword}
                            disabled={state.isLoading}
                        >
                            <Text style={styles.submitButtonText}>
                                {state.isLoading
                                    ? '処理中...'
                                    : isInitialSetup
                                        ? 'パスワードを設定'
                                        : 'パスワードを変更'}
                            </Text>
                        </TouchableOpacity>

                        {/* キャンセルボタン（通常モードのみ） */}
                        {!isInitialSetup && (
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => navigation.goBack()}
                                disabled={state.isLoading}
                            >
                                <Text style={styles.cancelButtonText}>キャンセル</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </ScrollView>
            <AlertComponent />
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
        padding: 20,
    },
    content: {
        maxWidth: 400,
        alignSelf: 'center',
        width: '100%',
    },
    header: {
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    policyContainer: {
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
    },
    policyTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1976d2',
        marginBottom: 8,
    },
    policyItem: {
        fontSize: 13,
        color: '#1976d2',
        marginBottom: 4,
    },
    form: {
        marginBottom: 20,
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
    errorText: {
        color: '#f44336',
        fontSize: 13,
        marginTop: 4,
    },
    submitButton: {
        backgroundColor: '#2196f3',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
});
