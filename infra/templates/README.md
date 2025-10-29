# Cognito メールテンプレート

このディレクトリには、Cognito User Poolで使用される招待メールのテンプレートが含まれています。

## ファイル構成

- `cognito-invitation-email-development.txt` - development環境用の招待メールテンプレート
- `cognito-invitation-email-production.txt` - production環境用の招待メールテンプレート

## テンプレート変数

### Cognitoが自動的に置換する変数

- `{username}` - 招待されたユーザーのユーザー名（メールアドレス）
- `{####}` - Cognitoが生成した一時パスワード

### CDKが置換する変数

- `{{WEB_APP_URL}}` - CloudFront DistributionのURL（Web版アプリのURL）

## テンプレートの編集

1. 該当する環境のテンプレートファイルを編集
2. CDKデプロイを実行して変更を反映

```bash
cd infra
npm run cdk deploy -- --context environment=development
```

## 注意事項

- テンプレートファイルが見つからない場合、デフォルトテンプレートが使用されます
- テンプレート変数 `{username}` と `{####}` は必ず含めてください
- メール本文は平文テキストのみサポートされています（HTMLは使用できません）
