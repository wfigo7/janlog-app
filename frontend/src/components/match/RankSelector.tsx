import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GameMode } from '../../types/common';
import { getRankColor } from '../../constants/rankColors';

interface RankSelectorProps {
  gameMode: GameMode;
  selectedRank: string;
  onRankChange: (rank: string) => void;
  error?: string | null;
}

const RankSelector: React.FC<RankSelectorProps> = ({
  gameMode,
  selectedRank,
  onRankChange,
  error,
}) => {
  const maxRank = gameMode === 'four' ? 4 : 3;

  return (
    <View>
      <View style={styles.rankSelector}>
        {Array.from({ length: maxRank }, (_, i) => i + 1).map((rank) => {
          const isSelected = selectedRank === String(rank);
          return (
            <TouchableOpacity
              key={rank}
              style={[
                styles.rankButton,
                isSelected && {
                  backgroundColor: getRankColor(rank, gameMode),
                  borderColor: getRankColor(rank, gameMode),
                },
              ]}
              onPress={() => onRankChange(String(rank))}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.rankButtonText,
                  isSelected && styles.rankButtonTextSelected,
                ]}
              >
                {rank}着
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  rankSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  rankButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  rankButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF9800',
    fontSize: 12,
    marginTop: 4,
  },
});

export default RankSelector;
