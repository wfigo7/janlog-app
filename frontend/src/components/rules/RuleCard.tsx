/**
 * ルールカードコンポーネント
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ruleset } from '@/src/types/ruleset';

interface RuleCardProps {
  rule: Ruleset;
  onEdit?: () => void;
  onDelete?: () => void;
  editable: boolean;
}

export default function RuleCard({ rule, onEdit, onDelete, editable }: RuleCardProps) {
  const formatUma = (uma: number[]) => {
    const formatNumber = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
    return uma.map(formatNumber).join(' / ');
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.ruleName}>{rule.ruleName}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {rule.gameMode === 'three' ? '3人麻雀' : '4人麻雀'}
          </Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <DetailRow label="開始点" value={`${rule.startingPoints}点`} />
        <DetailRow label="基準点" value={`${rule.basePoints}点`} />
        <DetailRow label="ウマ" value={formatUma(rule.uma)} />
        <DetailRow label="オカ" value={`+${rule.oka}`} />
        <DetailRow label="チップ" value={rule.useChips ? 'あり' : 'なし'} />
        {rule.memo && <DetailRow label="メモ" value={rule.memo} />}
      </View>

      {editable && (onEdit || onDelete) && (
        <View style={styles.cardActions}>
          {onEdit && (
            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <Text style={styles.editButtonText}>編集</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Text style={styles.deleteButtonText}>削除</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

/**
 * 詳細行コンポーネント
 */
interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  badge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '600',
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2196F3',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f44336',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
