/**
 * ルール作成画面
 */

import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { rulesetService } from '@/src/services/rulesetService';
import { Ruleset } from '@/src/types/ruleset';
import { useCustomAlert } from '@/src/hooks/useCustomAlert';
import { useRuleForm, RuleFormData } from '@/src/hooks/useRuleForm';
import RuleFormComponent from '@/src/components/rules/RuleFormComponent';

export default function RuleCreateScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const isGlobal = params.isGlobal === 'true';
    const { showAlert, AlertComponent } = useCustomAlert();

    const handleSubmit = async (formData: RuleFormData) => {
        const ruleData: Omit<Ruleset, 'rulesetId' | 'createdBy' | 'createdAt' | 'updatedAt'> = {
            ruleName: formData.ruleName.trim(),
            gameMode: formData.gameMode,
            startingPoints: parseInt(formData.startingPoints, 10),
            basePoints: parseInt(formData.basePoints, 10),
            useFloatingUma: formData.useFloatingUma,
            uma: formData.uma.map(u => parseInt(u, 10)),
            umaMatrix: formData.useFloatingUma ? formData.umaMatrix : undefined,
            oka: parseInt(formData.oka, 10),
            useChips: formData.useChips,
            memo: formData.memo.trim() || undefined,
            isGlobal: isGlobal,
        };

        await rulesetService.createRuleset(ruleData);
        showAlert({
            title: '成功',
            message: 'ルールを作成しました',
            buttons: [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ],
        });
    };

    const {
        formData,
        errors,
        isSubmitting,
        handleGameModeChange,
        updateField,
        updateUma,
        handleSubmit: submit,
    } = useRuleForm({
        onSubmit: handleSubmit,
    });

    const onSubmit = async () => {
        try {
            const success = await submit();
            if (!success) {
                showAlert({
                    title: '入力エラー',
                    message: '入力内容を確認してください',
                });
            }
        } catch (error) {
            console.error('Failed to create rule:', error);
            const errorMessage = error instanceof Error ? error.message : 'ルールの作成に失敗しました';
            showAlert({
                title: 'エラー',
                message: errorMessage,
            });
        }
    };

    return (
        <>
            <AlertComponent />
            <RuleFormComponent
                formData={formData}
                errors={errors}
                isSubmitting={isSubmitting}
                submitButtonText="作成"
                onGameModeChange={handleGameModeChange}
                onFieldChange={updateField}
                onUmaChange={updateUma}
                onSubmit={onSubmit}
            />
        </>
    );
}
