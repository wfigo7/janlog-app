/**
 * ルール管理画面
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { rulesetService } from '@/src/services/rulesetService';
import { Ruleset } from '@/src/types/ruleset';
import RuleList from '@/src/components/rules/RuleList';
import { CustomAlert } from '@/src/components/common/CustomAlert';
import { useGameMode } from '@/src/contexts/GameModeContext';

export default function RulesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { gameMode } = useGameMode();
    const [globalRules, setGlobalRules] = useState<Ruleset[]>([]);
    const [personalRules, setPersonalRules] = useState<Ruleset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
    const [successAlertVisible, setSuccessAlertVisible] = useState(false);
    const [errorAlertVisible, setErrorAlertVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [ruleToDelete, setRuleToDelete] = useState<{ id: string; name: string; isGlobal: boolean } | null>(null);

    const isAdmin = user?.role === 'admin';

    /**
     * ルール一覧を取得
     */
    const fetchRules = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const rules = await rulesetService.getRulesets();

            // ゲームモードでフィルタリングし、グローバルルールと個人ルールに分類し、ルール名の昇順でソート
            const filteredRules = rules.filter(r => r.gameMode === gameMode);
            
            const global = filteredRules
                .filter(r => r.isGlobal)
                .sort((a, b) => a.ruleName.localeCompare(b.ruleName, 'ja'));
            const personal = filteredRules
                .filter(r => !r.isGlobal)
                .sort((a, b) => a.ruleName.localeCompare(b.ruleName, 'ja'));

            setGlobalRules(global);
            setPersonalRules(personal);
        } catch (err) {
            console.error('Failed to fetch rules:', err);
            setError('ルールの取得に失敗しました');
        } finally {
            setIsLoading(false);
        }
    }, [gameMode]);

    useFocusEffect(
        useCallback(() => {
            fetchRules();
        }, [fetchRules])
    );

    /**
     * 新規作成画面への遷移
     */
    const handleCreate = (isGlobal: boolean) => {
        if (isGlobal && !isAdmin) {
            setErrorMessage('グローバルルールの作成は管理者のみ可能です');
            setErrorAlertVisible(true);
            return;
        }
        router.push({
            pathname: '../rules/create',
            params: { isGlobal: isGlobal ? 'true' : 'false' },
        } as any);
    };

    /**
     * 編集画面への遷移
     */
    const handleEdit = (rule: Ruleset) => {
        if (rule.isGlobal && !isAdmin) {
            setErrorMessage('グローバルルールは編集できません');
            setErrorAlertVisible(true);
            return;
        }
        router.push(`../rules/${rule.rulesetId}` as any);
    };

    /**
     * 削除ダイアログを開く
     */
    const handleDelete = (rulesetId: string, isGlobal: boolean, ruleName: string) => {
        if (isGlobal && !isAdmin) {
            setErrorMessage('グローバルルールは削除できません');
            setErrorAlertVisible(true);
            return;
        }

        setRuleToDelete({ id: rulesetId, name: ruleName, isGlobal });
        setDeleteAlertVisible(true);
    };

    /**
     * 削除を確定
     */
    const handleConfirmDelete = async () => {
        if (!ruleToDelete) return;

        setDeleteAlertVisible(false);

        try {
            await rulesetService.deleteRuleset(ruleToDelete.id);
            setSuccessAlertVisible(true);
            await fetchRules();
        } catch (err) {
            console.error('Failed to delete rule:', err);
            setErrorMessage('ルールの削除に失敗しました');
            setErrorAlertVisible(true);
        } finally {
            setRuleToDelete(null);
        }
    };

    /**
     * 削除をキャンセル
     */
    const handleCancelDelete = () => {
        setDeleteAlertVisible(false);
        setRuleToDelete(null);
    };

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchRules}>
                    <Text style={styles.retryButtonText}>再試行</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <>
            <ScrollView style={styles.container}>
                {/* 管理者のみ表示：グローバルルールセクション */}
                {isAdmin && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>グローバルルール（全員共通）</Text>
                            <TouchableOpacity
                                style={styles.createButton}
                                onPress={() => handleCreate(true)}
                            >
                                <Text style={styles.createButtonText}>+ 新規作成</Text>
                            </TouchableOpacity>
                        </View>
                        <RuleList
                            rules={globalRules}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            editable={true}
                        />
                    </View>
                )}

                {/* 個人ルールセクション */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>個人ルール</Text>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => handleCreate(false)}
                        >
                            <Text style={styles.createButtonText}>+ 新規作成</Text>
                        </TouchableOpacity>
                    </View>
                    <RuleList
                        rules={personalRules}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        editable={true}
                    />
                </View>

                {/* 一般ユーザー向け：グローバルルール参考表示 */}
                {!isAdmin && globalRules.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>グローバルルール（参考）</Text>
                        <RuleList
                            rules={globalRules}
                            editable={false}
                        />
                    </View>
                )}
            </ScrollView>

            {/* 削除確認アラート */}
            <CustomAlert
                visible={deleteAlertVisible}
                title="ルールを削除"
                message={`「${ruleToDelete?.name}」を削除してもよろしいですか？\n\n※ 既存の対局データには影響しません`}
                buttons={[
                    {
                        text: 'キャンセル',
                        style: 'cancel',
                        onPress: handleCancelDelete,
                    },
                    {
                        text: '削除',
                        style: 'destructive',
                        onPress: handleConfirmDelete,
                    },
                ]}
                onDismiss={handleCancelDelete}
            />

            {/* 成功アラート */}
            <CustomAlert
                visible={successAlertVisible}
                title="成功"
                message="ルールを削除しました"
                buttons={[
                    {
                        text: 'OK',
                        onPress: () => setSuccessAlertVisible(false),
                    },
                ]}
                onDismiss={() => setSuccessAlertVisible(false)}
            />

            {/* エラーアラート */}
            <CustomAlert
                visible={errorAlertVisible}
                title="エラー"
                message={errorMessage}
                buttons={[
                    {
                        text: 'OK',
                        onPress: () => setErrorAlertVisible(false),
                    },
                ]}
                onDismiss={() => setErrorAlertVisible(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    section: {
        marginBottom: 24,
        paddingHorizontal: 12,
        paddingTop: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    createButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    errorText: {
        color: '#f44336',
        fontSize: 16,
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
