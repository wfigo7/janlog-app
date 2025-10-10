/**
 * Expo App Configuration
 * 環境変数を動的に読み込む
 */

// EASビルド時は.env.developmentを使用、ローカルでは.env.localを優先
const APP_ENV = process.env.APP_ENV || process.env.EXPO_PUBLIC_ENV || 'local';

console.log('Loading app config for environment:', APP_ENV);

// 環境に応じた.envファイルを読み込む
// ローカル開発時: .env.local（存在する場合）
// EASビルド時: .env.development（APP_ENV=developmentの場合）
if (APP_ENV === 'local') {
  console.log('Using .env.local for local development');
} else {
  console.log(`Using .env.${APP_ENV} for EAS build`);
}

export default {
  expo: {
    name: 'Janlog',
    slug: 'janlog',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'janlog',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.janlog.app',
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
      // 環境情報を追加
      appEnv: APP_ENV,
    },
    owner: 'wfigo7',
  },
};
