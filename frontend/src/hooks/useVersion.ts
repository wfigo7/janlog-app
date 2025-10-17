/**
 * バージョン情報取得フック
 * 
 * アプリのバージョン、ビルド番号、サーバーバージョンを取得します。
 */

import { useState, useEffect } from 'react';
import Constants from 'expo-constants';
import { apiClient } from '../utils/apiClient';

interface VersionInfo {
  appVersion: string;
  buildNumber: string;
  serverVersion: string | null;
}

interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
  services: {
    dynamodb: string;
    api: string;
  };
}

/**
 * バージョン情報を取得するフック
 * 
 * @returns VersionInfo - アプリバージョン、ビルド番号、サーバーバージョン
 */
export function useVersion(): VersionInfo {
  const [serverVersion, setServerVersion] = useState<string | null>(null);

  useEffect(() => {
    const fetchServerVersion = async () => {
      try {
        // /health エンドポイントからバージョン情報を取得
        const data = await apiClient.get<HealthResponse>('/health');
        setServerVersion(data.version);
      } catch (error) {
        console.error('Failed to fetch server version:', error);
        setServerVersion(null);
      }
    };

    fetchServerVersion();
  }, []);

  return {
    appVersion: Constants.expoConfig?.version || 'Unknown',
    buildNumber: 
      Constants.expoConfig?.android?.versionCode?.toString() || 
      Constants.expoConfig?.ios?.buildNumber || 
      'Unknown',
    serverVersion,
  };
}
