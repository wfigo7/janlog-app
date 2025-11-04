# 対局種別フィールド追加 - 要件書

## イントロダクション

Janlogアプリケーションの対局データに「対局種別」フィールドを追加します。この対局種別は、フリー雀荘での対局か、セット麻雀での対局か、競技麻雀での対局かを記録するためのもので、統計フィルタリングに利用できます。既存データとの互換性を保つため、null値を許容します。

## 用語集

- **System**: Janlogアプリケーション（フロントエンド・バックエンド・データベースを含む）
- **Match**: 対局データエンティティ
- **MatchType**: 対局種別（フリー/セット/競技を識別するenum型フィールド）
- **Ruleset**: ルールセット情報
- **Venue**: 会場情報
- **Memo**: メモ情報
- **Stats**: 成績統計データ

## 要件

### 要件 1: 対局種別フィールドの追加

**ユーザーストーリー:** ユーザーとして、対局がフリー雀荘でのものか、セット麻雀でのものか、競技麻雀でのものかを記録したいので、後で種別ごとに成績を分析できる

#### 受入基準

1. THE System SHALL MatchエンティティにmatchTypeフィールドを追加する
2. THE matchTypeフィールド SHALL enum型（"free" | "set" | "competition"）でnull値を許容する
3. THE matchTypeフィールド SHALL ルールセット（ruleset）フィールドの後、入力フィールドの前に配置する
4. WHEN 既存の対局データを読み込む時 THEN System はmatchTypeフィールドがnullであることを適切に処理する
5. WHEN 新規対局を登録する時 THEN System はmatchTypeフィールドの入力を任意とする
6. WHEN ユーザーがmatchTypeを指定せずに対局を登録する時 THEN System はmatchTypeをnullとして保存する
7. WHEN ユーザーがmatchTypeを指定して対局を登録する時 THEN System は指定されたmatchType値を保存する
8. WHEN ユーザーがmatchTypeを指定して対局を登録する時 THEN 画面 は指定されたmatchType値をリセットしない
9. THE matchTypeフィールド SHALL 将来的に新しい種別を追加できるよう拡張可能な設計とする

### 要件 2: 対局登録画面での対局種別入力

**ユーザーストーリー:** ユーザーとして、対局登録時に対局種別をボタンで選択したいので、順位や入力方式と同じ操作感で対局の種類を記録できる

#### 受入基準

1. WHEN ユーザーが対局登録画面にアクセスする時 THEN System は対局種別選択ボタングループを表示する
2. THE 対局種別選択ボタングループ SHALL ルールセット選択フィールドの下、会場選択フィールドの上に配置する
3. THE 対局種別選択ボタングループ SHALL 任意入力項目として表示する
4. THE 対局種別選択ボタングループ SHALL 「フリー」「セット」「競技」の3つのボタンを含む
5. THE 対局種別選択ボタン SHALL 順位選択ボタンや入力方式選択ボタンと同じデザインパターンを使用する
6. WHEN ユーザーが「フリー」ボタンをタップする時 THEN System はmatchTypeフィールドに"free"を設定する
7. WHEN ユーザーが「セット」ボタンをタップする時 THEN System はmatchTypeフィールドに"set"を設定する
8. WHEN ユーザーが「競技」ボタンをタップする時 THEN System はmatchTypeフィールドに"competition"を設定する
9. WHEN ユーザーが選択済みのボタンを再度タップする時 THEN System は選択を解除してmatchTypeをnullに設定する
10. WHEN ユーザーが対局種別を選択せずに対局を登録する時 THEN System はmatchTypeフィールドをnullとして保存する
11. THE System SHALL 選択中のボタンを視覚的に強調表示する
12. THE System SHALL 未選択状態を許容する（「指定なし」ボタンは提供しない）

### 要件 3: 対局編集画面での対局種別変更

**ユーザーストーリー:** ユーザーとして、既存対局の対局種別を変更したいので、後から種別を追加または修正できる

#### 受入基準

1. WHEN ユーザーが対局編集画面にアクセスする時 THEN System は現在の対局種別値をボタン選択状態で表示する
2. WHEN 既存対局のmatchTypeがnullの時 THEN System は全てのボタンを未選択状態で表示する
3. WHEN ユーザーが対局種別ボタンをタップする時 THEN System は新し局デー種別値で対局データを更新する
4. WHEN ユーザーが選択済みのボタンを再度タップする時 THEN System はmatchTypeをnullに更新する

### 要件 4: 対局履歴での対局種別表示

**ユーザーストーリー:** ユーザーとして、対局履歴で各対局の種別を確認したいので、どの対局がフリーでどの対局がセットか、どの対局が競技かを把握できる

#### 受入基準

1. WHEN ユーザーが対局履歴画面にアクセスする時 THEN System は各対局の対局種別を表示する
2. WHEN 対局のmatchTypeがnullの時 THEN System は対局種別を表示しない
3. WHEN 対局のmatchTypeが"free"の時 THEN System は「フリー」バッジを表示する
4. WHEN 対局のmatchTypeが"set"の時 THEN System は「セット」バッジを表示する
5. WHEN 対局のmatchTypeが"competition"の時 THEN System は「競技」バッジを表示する
6. THE 対局種別バッジ SHALL ルール名の近くに配置する

### 要件 5: 統計フィルタでの対局種別利用

**ユーザーストーリー:** ユーザーとして、統計画面で対局種別ごとにフィルタリングしたいので、フリー雀荘での成績とセット麻雀での成績と競技麻雀での成績を分けて分析できる

#### 受入基準

1. WHEN ユーザーが統計画面にアクセスする時 THEN System は対局種別フィルタオプションを表示する
2. THE 対局種別フィルタ SHALL 期間フィルタとゲームモードフィルタと並んで配置する
3. THE 対局種別フィルタ SHALL 「すべての対局種別」「フリー」「セット」「競技」の4つのオプションを含む
4. WHEN ユーザーが「すべての対局種別」を選択する時 THEN System は全ての対局（matchTypeがnullの対局を含む）を統計に含める
5. WHEN ユーザーが「フリー」を選択する時 THEN System はmatchTypeが"free"の対局のみを統計に含める
6. WHEN ユーザーが「セット」を選択する時 THEN System はmatchTypeが"set"の対局のみを統計に含める
7. WHEN ユーザーが「競技」を選択する時 THEN System はmatchTypeが"competition"の対局のみを統計に含める
8. WHEN ユーザーが対局種別フィルタを変更する時 THEN System は統計データを再計算して表示する
9. THE System SHALL デフォルトで「すべての対局種別」フィルタを選択する

### 要件 6: 履歴フィルタでの対局種別利用

**ユーザーストーリー:** ユーザーとして、履歴画面で対局種別ごとにフィルタリングしたいので、特定の種別の対局のみを表示できる

#### 受入基準

1. WHEN ユーザーが履歴画面にアクセスする時 THEN System は対局種別フィルタオプションを表示する
2. THE 対局種別フィルタ SHALL 期間フィルタとゲームモードフィルタと並んで配置する
3. THE 対局種別フィルタ SHALL 「すべての対局種別」「フリー」「セット」「競技」の4つのオプションを含む
4. WHEN ユーザーが「すべての対局種別」を選択する時 THEN System は全ての対局（matchTypeがnullの対局を含む）を履歴に表示する
5. WHEN ユーザーが「フリー」を選択する時 THEN System はmatchTypeが"free"の対局のみを表示する
6. WHEN ユーザーが「セット」を選択する時 THEN System はmatchTypeが"set"の対局のみを表示する
7. WHEN ユーザーが「競技」を選択する時 THEN System はmatchTypeが"competition"の対局のみを表示する
8. WHEN ユーザーが対局種別フィルタを変更する時 THEN System は履歴リストを再取得して表示する

### 要件 7: API仕様の拡張

**ユーザーストーリー:** 開発者として、API経由で対局種別フィールドを扱いたいので、フロントエンドとバックエンド間で対局種別データを送受信できる

#### 受入基準

1. THE System SHALL MatchスキーマにmatchTypeフィールドをOpenAPI仕様に追加する
2. THE matchTypeフィールド SHALL enum型（"free" | "set" | "competition"）でnullableとして定義する
3. THE matchTypeフィールド SHALL rulesetIdフィールドの後、venueIdフィールドの前に配置する
4. WHEN GET /matchesエンドポイントを呼び出す時 THEN System はmatchTypeフィールドを含むMatchオブジェクトを返す
5. WHEN POST /matchesエンドポイントを呼び出す時 THEN System はmatchTypeフィールドを受け付ける
6. WHEN PUT /matches/{matchId}エンドポイントを呼び出す時 THEN System はmatchTypeフィールドの更新を受け付ける
7. WHEN GET /stats/summaryエンドポイントにmatchTypeクエリパラメータを指定する時 THEN System は指定された対局種別の対局のみで統計を計算する
8. WHEN GET /matchesエンドポイントにmatchTypeクエリパラメータを指定する時 THEN System は指定された対局種別の対局のみを返す
9. THE matchTypeクエリパラメータ SHALL "free"、"set"、"competition"の値を受け付ける（指定なしの場合は全ての対局種別を含む）

### 要件 8: データベーススキーマの拡張

**ユーザーストーリー:** 開発者として、DynamoDBに対局種別データを保存したいので、対局データの一部として対局種別を永続化できる

#### 受入基準

1. THE System SHALL DynamoDB MatchエンティティにmatchTypeAttributeを追加する
2. THE matchTypeAttribute SHALL 文字列型（"free" | "set" | "competition"）でnull値を許容する
3. WHEN matchTypeがnullの時 THEN System はDynamoDBにmatchTypeAttributeを保存しない
4. WHEN matchTypeが指定されている時 THEN System はDynamoDBにmatchTypeAttributeを保存する
5. WHEN 既存の対局データを読み込む時 THEN System はmatchTypeAttributeが存在しない場合にnullとして扱う

### 要件 9: 既存データとの互換性

**ユーザーストーリー:** 開発者として、既存の対局データを保護したいので、新しいフィールド追加が既存データに影響を与えない

#### 受入基準

1. WHEN 既存の対局データを読み込む時 THEN System はmatchTypeフィールドが存在しない場合にnullとして扱う
2. WHEN 既存の対局データを表示する時 THEN System はmatchTypeがnullの場合に適切に表示する
3. WHEN 既存の対局データを編集する時 THEN System はmatchTypeフィールドを追加できる
4. WHEN 既存の対局データを統計に含める時 THEN System はmatchTypeがnullの対局を適切に処理する
5. THE System SHALL データマイグレーションなしで既存データを扱える

### 要件 10: バリデーション

**ユーザーストーリー:** 開発者として、対局種別フィールドの値を検証したいので、不正なデータが保存されることを防げる

#### 受入基準

1. WHEN matchTypeフィールドに値が指定される時 THEN System は値が"free"、"set"、"competition"のいずれかであることを検証する
2. WHEN matchTypeフィールドに不正な値が指定される時 THEN System は「対局種別が不正です」エラーメッセージを返す
3. WHEN matchTypeフィールドがnullの時 THEN System はバリデーションをスキップする
4. WHEN バリデーションエラーが発生する時 THEN System は適切なHTTPステータスコード（400 Bad Request）を返す
5. THE System SHALL フロントエンドとバックエンドの両方でバリデーションを実行する
