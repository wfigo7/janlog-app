import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GameMode } from '../../types/common';

interface GameModeSectionProps {
  selectedMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  title?: string;
}

export const GameModeSection: React.FC<GameModeSectionProps> = ({
  selectedMode,
  onModeChange,
  title = "ゲームモード",
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedMode === 'four' && styles.activeTab]}
          onPress={() => onModeChange('four')}
        >
          <Text style={[styles.tabText, selectedMode === 'four' && styles.activeTabText]}>
            4人麻雀
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedMode === 'three' && styles.activeTab]}
          onPress={() => onModeChange('three')}
        >
          <Text style={[styles.tabText, selectedMode === 'three' && styles.activeTabText]}>
            3人麻雀
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
});