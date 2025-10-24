/**
 * ルール一覧コンポーネント
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ruleset } from '@/src/types/ruleset';
import RuleCard from './RuleCard';

interface RuleListProps {
  rules: Ruleset[];
  onEdit?: (rule: Ruleset) => void;
  onDelete?: (rulesetId: string, isGlobal: boolean, ruleName: string) => void;
  editable: boolean;
}

export default function RuleList({ rules, onEdit, onDelete, editable }: RuleListProps) {
  if (rules.length === 0) {
    return <Text style={styles.emptyText}>ルールがありません</Text>;
  }

  return (
    <View>
      {rules.map(rule => (
        <RuleCard
          key={rule.rulesetId}
          rule={rule}
          onEdit={editable && onEdit ? () => onEdit(rule) : undefined}
          onDelete={editable && onDelete ? () => onDelete(rule.rulesetId, rule.isGlobal, rule.ruleName) : undefined}
          editable={editable}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 32,
  },
});
