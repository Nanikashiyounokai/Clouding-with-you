# 曇天気の娘（Expo 版 2.0）

登録した地点が曇りそうなとき「だけ」通知するアプリ。2026-10-13 の報告会で、
**「曇りを通知するだけ」のコンセプトのまま作り直す（案 A）**と決定。追加はシェアカードだけ。

| 場所 | 中身 |
| --- | --- |
| `src/` | アプリ（Expo SDK 57・expo-router）。iOS と Android 共通 |
| `server/` | 曇り通知サーバー（Cloudflare Workers + D1）。10 分おきに判定して Expo Push で送る |
| `assets/` | 旧版から引き継いだ画像・通知音・BGM（平山の自作曲。AAC に変換） |

旧 Android 版（Kotlin）は `20261007_hirayama` ブランチ以前に残っている。

## 旧版から変えたところ

- **見張りを端末からサーバーへ**。旧版は常駐サービスで 10 分おきに天気を取っていたが、
  Android 15 以降は 24 時間で計 6 時間しか動けず、再起動後も戻らなかった。iOS は常駐できない
- **曇り判定**を「60 分以内に雲量が 30 ポイント以上増え、70% 以上になる」に変更（`server/src/rule.ts`）。
  鳴ったら 3 時間あける・1 日 3 回まで・22〜7 時は鳴らさない。**数字は報告会で未決定の仮置き**
- 天気 API は近い地点（0.1 度四方）をまとめて 1 回。呼び出しが地域数に比例する
- 地点登録は地図＋地名検索＋現在地。緯度経度の直接入力は「詳しく」に下げた
- 曇り通知をタップすると「今から曇るよ」シェアカード（画像で共有）
- 広告はアプリ起動広告だけ。通知から開いたときは出さない／インストール後 3 日は出さない／1 日 2 回まで
- 旧版の登録地点（Realm）は初回起動時に自動で取り込む（Android のみ。iOS 版は存在しなかった）

## 公開前に人がやること

2026-10-14 時点の状況。

| # | 作業 | 状況 |
| --- | --- | --- |
| 1 | EAS プロジェクト | **済**（@skart-inc/clouding-with-you・eas.json あり） |
| 2 | 通知サーバー（Cloudflare Workers + D1） | **デプロイ済**（https://clouding-with-you.skart20220220.workers.dev）。**OpenWeather のキーを人が入れる**：`cd server && npx wrangler secret put OPENWEATHER_API_KEY` |
| 3 | プッシュの認証情報 | **人**：Android は Firebase の FCM V1 サービスアカウント鍵、iOS は APNs 鍵を `npx eas-cli credentials` で登録。無いと通知が届かない |
| 4 | AdMob（起動広告ユニット・GDPR 同意メッセージ・iOS アプリ） | **人**：アプリ ID の pub-2529… を持つ Google アカウントが Chrome のログイン中アカウントに見当たらなかった。どのアカウントか確認が要る |
| 5 | iOS の Bundle ID | **決定** `com.skart.cloudingwithyou`。App Store Connect でのアプリ作成は人 |
| 6 | アプリアイコン 1024px | **済**（デザイン原画から切り出し） |
| 7 | Android の署名鍵を EAS に登録 | **人**：`~/Desktop/SKart/その他/Key.jks`。旧版と同じ鍵でないとアップデートにならない |
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
