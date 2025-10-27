/**
 * ヘッダー右側に配置されるゲームモード切り替えコンポーネント
 * セグメントコントロール形式のUI
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useGameMode } from '../../contexts/GameModeContext';
import { GameMode } from '../../types/common';

export const HeaderGameModeSelector: React.FC = () => {
  const { gameMode, setGameMode } = useGameMode();
  const slideAnim = useRef(new Animated.Value(gameMode === 'four' ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: gameMode === 'four' ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [gameMode]);

  const handlePress = async (mode: GameMode) => {
    if (mode === gameMode) return;
    try {
      await setGameMode(mode);
    } catch (error) {
      console.error('Failed to change game mode:', error);
    }
  };

  const indicatorTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 69], // 左端から右端への移動距離
  });

  return (
    <View style={styles.container}>
      <View style={styles.segmentContainer}>
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              transform: [{ translateX: indicatorTranslateX }],
            },
          ]}
        />
        <TouchableOpacity
          style={styles.segment}
          onPress={() => handlePress('four')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentText,
              gameMode === 'four' && styles.activeText,
            ]}
          >
            4人麻雀
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.segment}
          onPress={() => handlePress('three')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentText,
              gameMode === 'three' && styles.activeText,
            ]}
          >
            3人麻雀
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    padding: 3,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 3,
    left: 0,
    width: 64,
    height: 32,
    backgroundColor: '#007AFF',
    borderRadius: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  segment: {
    width: 64,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    zIndex: 1,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeText: {
    color: '#FFFFFF',
  },
});
