import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MatchType } from '../../types/match';

interface MatchTypeBadgeProps {
  matchType: MatchType | null;
}

const MatchTypeBadge: React.FC<MatchTypeBadgeProps> = ({ matchType }) => {
  if (!matchType) return null;

  const labels: Record<MatchType, string> = {
    free: 'フリー',
    set: 'セット',
    competition: '競技',
  };

  const colors: Record<MatchType, string> = {
    free: '#4CAF50',
    set: '#2196F3',
    competition: '#FF9800',
  };

  return (
    <View style={[styles.badge, { backgroundColor: colors[matchType] }]}>
      <Text style={styles.text}>{labels[matchType]}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default MatchTypeBadge;
