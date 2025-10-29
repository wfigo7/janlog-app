/**
 * パスワード変更画面ルート
 */

import { ChangePasswordScreen } from '../src/components/auth/ChangePasswordScreen';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ChangePasswordRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    isInitialSetup?: string;
    session?: string;
    username?: string;
  }>();

  // パラメータを適切な型に変換
  const routeParams = {
    isInitialSetup: params.isInitialSetup === 'true',
    session: params.session,
    username: params.username,
  };

  // navigationオブジェクトを作成
  const navigation = {
    goBack: () => router.back(),
  };

  return (
    <ChangePasswordScreen
      route={{ params: routeParams }}
      navigation={navigation}
    />
  );
}
