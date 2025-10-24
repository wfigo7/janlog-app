/**
 * ルール編集画面
 */

import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import RuleFormScreen from '@/src/components/rules/RuleFormScreen';

export default function RuleEditScreen() {
    const { rulesetId } = useLocalSearchParams<{ rulesetId: string }>();
    
    return <RuleFormScreen mode="edit" rulesetId={rulesetId} />;
}
