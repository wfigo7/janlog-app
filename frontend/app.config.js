/**
 * Expo App Configuration
 * 環境変数を動的に読み込む
 */

// package.jsonからバージョンを読み込む
const packageJson = require('./package.json');
const APP_VERSION = packageJson.version;

// EASビルド時の環境変数を取得
const APP_ENV = process.env.APP_ENV || process.env.EXPO_PUBLIC_ENV || 'local';
const AUTH_MODE = process.env.EXPO_PUBLIC_AUTH_MODE || 'mock';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const COGNITO_USER_POOL_ID = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID || '';
const COGNITO_CLIENT_ID = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID || '';
const COGNITO_REGION = process.env.EXPO_PUBLIC_COGNITO_REGION || 'ap-northeast-1';
const DEBUG = process.env.EXPO_PUBLIC_DEBUG || 'false';

// デバッグモードまたは環境変数DEBUG_CONFIGが設定されている場合のみログ出力
if (DEBUG === 'true' || process.env.DEBUG_CONFIG === 'true') {
  console.log('=== Expo App Config ===');
  console.log('APP_ENV:', APP_ENV);
  console.log('AUTH_MODE:', AUTH_MODE);
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('COGNITO_USER_POOL_ID:', COGNITO_USER_POOL_ID);
  console.log('COGNITO_CLIENT_ID:', COGNITO_CLIENT_ID);
  console.log('======================');
}

export default {
  expo: {
    name: 'Janlog',
    slug: 'janlog',
    version: APP_VERSION,
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'janlog',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.janlog.app',
      buildNumber: '1',
    },
    android: {
      package: 'com.janlog.app',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '19442353-ca80-4ebe-8303-89f51b767ab9',
      },
      // 環境変数をextraに明示的に設定（Constants.expoConfig.extraでアクセス可能）
      appEnv: APP_ENV,
      authMode: AUTH_MODE,
      apiBaseUrl: API_BASE_URL,
      cognitoUserPoolId: COGNITO_USER_POOL_ID,
      cognitoClientId: COGNITO_CLIENT_ID,
      cognitoRegion: COGNITO_REGION,
      debug: DEBUG,
    },
    owner: 'wfigo7',
  },
};
