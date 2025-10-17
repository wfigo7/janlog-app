/**
 * バージョン情報表示コンポーネント
 * 
 * アプリバージョン、ビルド番号、サーバーバージョンを表示します。
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useVersion } from '@/src/hooks/useVersion';

export function VersionInfo() {
  const { appVersion, buildNumber, serverVersion } = useVersion();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>バージョン情報</Text>

      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>アプリバージョン</Text>
        <Text style={styles.infoValue}>v{appVersion}</Text>
      </View>

      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>ビルド番号</Text>
        <Text style={styles.infoValue}>{buildNumber}</Text>
      </View>

      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>サーバーバージョン</Text>
        <Text style={styles.infoValue}>
          {serverVersion ? `v${serverVersion}` : '不明'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
});
