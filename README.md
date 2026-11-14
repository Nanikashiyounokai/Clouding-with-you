# 曇天気の娘（Expo 版 2.0）

登録した地点が曇りそうなとき「だけ」通知するアプリ。2026-10-13 の報告会で、
**「曇りを通知するだけ」のコンセプトのまま作り直す（案 A）**と決定。追加はシェアカードだけ。

| 場所 | 中身 |
| --- | --- |
| `src/` | アプリ（Expo SDK 57・expo-router）。iOS と Android 共通 |
| `server/` | **停止中**（2026-10-19）。旧方式の曇り通知サーバー（Cloudflare Workers + D1）。定期実行を止め、天気 API のキーも消した |
| `assets/` | 旧版から引き継いだ画像・通知音・BGM（平山の自作曲。AAC に変換） |

旧 Android 版（Kotlin）は `20261007_hirayama` ブランチ以前に残っている。

## 旧版から変えたところ

- **サーバーを持たない**（2026-10-19）。各スマホがノルウェー気象局（MET Norway）の予報を直接取り、
  曇りの通知をスマホの中に予約する（`src/clouds/`）。MET Norway は無料・API キーなし・世界中・商用可で、
  **利用者が何人になっても SKart の支出は 0 円**。OpenWeather（従量課金）はやめた
- 予報を取り直すのは、アプリを開いたとき・祈願中の地点を変えたとき・裏で OS が動かしたとき
  （expo-background-task。Android は 30 分以上の間隔、iOS は OS しだい）。
  取り直しが 48 時間止まったら「しばらく空を見上げていません」と 1 回だけ声をかける
- **ホーム画面ウィジェット**（次に曇りそうな時刻）。Android は `react-native-android-widget`（`src/widget/`）で、アプリからボタン 1 つで置ける。
  iOS は WidgetKit（`targets/widget/`、`@bacons/apple-targets`）。iOS はアプリから置けないので置き方を案内する。
  iOS のウィジェットは自分でも MET Norway の予報を取り、通知を予約し直す（アプリを開かなくても止まらないように）
- 送る位置は登録した場所を小数 2 桁（約 1km）に丸めたもの。初回に説明画面で同意をもらう（`src/components/Consent.tsx`）
- **曇り判定**：予報の雲量が 30% 以下（晴れ）から 70% 以上（曇り）に変わる 1 時間前に鳴らす（`src/domain/cloudPlan.ts`）。
  1 回の曇りにつき 1 回・鳴ったら 3 時間あける・1 日 3 回まで。**昼も夜も鳴らす**（天体観測にも使える）
- 地点登録は地図＋地名検索＋現在地。緯度経度の表示と直接入力はなくした
- 曇り通知をタップすると「今から曇るよ」シェアカード（画像で共有）
- 広告は画面下のバナーだけ（タイトルと登録地点）。地点を選ぶ画面とシェアカードには出さない
- レビュー依頼は、曇りのシェアカードを閉じた／共有したときだけ。インストール後 3 日・前回から 120 日あける・生涯 3 回まで
- 旧版の登録地点（Realm）は初回起動時に自動で取り込む（Android のみ。iOS 版は存在しなかった）

## 公開前に人がやること

2026-10-19 時点の状況。

| # | 作業 | 状況 |
| --- | --- | --- |
| 1 | EAS プロジェクト | **済**（@skart-inc/clouding-with-you・eas.json あり） |
| 2 | 通知サーバー | **不要になった**（2026-10-19）。Worker は定期実行を止めて残してある。消すなら `cd server && npx wrangler delete` |
| 3 | プッシュの認証情報 | **不要になった**。通知はスマホの中で予約するので、FCM・APNs の鍵は使わない |
| 4 | AdMob（バナー広告ユニット・GDPR 同意メッセージ・iOS アプリ） | **人**：アプリ ID の pub-2529… を持つ Google アカウントが Chrome のログイン中アカウントに見当たらなかった。どのアカウントか確認が要る |
| 5 | iOS の Bundle ID | **決定** `com.skart.cloudingwithyou`。App Store Connect でのアプリ作成は人 |
| 6 | アプリアイコン 1024px | **済**（デザイン原画から切り出し） |
| 7 | Android の署名鍵を EAS に登録 | **人**：`~/Desktop/SKart/その他/Key.jks`。旧版と同じ鍵でないとアップデートにならない |
| 9 | iOS ウィジェットの App ID と App Group | **人**：初回の `eas build -p ios` で Apple アカウントにログインすると、ウィジェット（`com.skart.cloudingwithyou.widget`）と App Group（`group.com.skart.cloudingwithyou`）が登録される。iOS 実機での見た目の確認も未 |
| 8 | 両ストアのデータ申告・プライバシーポリシー | **人**：下書きは SKart/アプリ開発/01_曇天気の娘/2026-10-14_ストア申告の下書き.md |

## 開発

```bash
npm install
npx expo run:android      # 開発ビルド（ANDROID_HOME と JDK 17 が要る）
npm test                  # 地点操作・旧データ・曇り判定・広告頻度のテスト
npm run typecheck && npm run lint

cd server && npm install
npx wrangler d1 execute clouding-with-you --local --file=schema.sql
npm run dev               # http://localhost:8787/__scheduled で定期処理を手動実行
```
