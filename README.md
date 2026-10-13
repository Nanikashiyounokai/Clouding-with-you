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

| # | 作業 | どこ |
| --- | --- | --- |
| 1 | `npx eas-cli@latest init` で EAS プロジェクトを作る（`extra.eas.projectId` が入る。無いとプッシュが届かない） | ターミナル |
| 2 | Cloudflare に D1 を作り、`server/wrangler.toml` の `database_id` を書く。`schema.sql` を流す | `server/` |
| 3 | `npx wrangler secret put OPENWEATHER_API_KEY`（旧版と同じキーで可。One Call 3.0 の無料枠は 1,000 回／日 ≒ 7 地域） | `server/` |
| 4 | `npx wrangler deploy` し、出てきた URL を `app.json` の `extra.apiBaseUrl` に書く | `server/` |
| 5 | AdMob でアプリ起動広告のユニットを作り、`src/ads/config.ts` の `production` に書く（Android は旧版のアプリ pub-2529… に追加） | AdMob |
| 6 | AdMob に iOS アプリを登録し、`app.json` の `iosAppId` を差し替える（今は Google のサンプル ID） | AdMob |
| 7 | iOS の Bundle ID（仮 `com.skart.cloudingwithyou`）で App Store Connect にアプリを作る | ASC |
| 8 | アプリアイコンの 1024px 原画を `assets/images/icon.png` に置く（今は 432px を拡大した仮） | — |
| 9 | Android の署名鍵（`~/Desktop/SKart/その他/Key.jks`）を EAS に登録。旧版と同じ鍵でないとアップデートにならない | EAS |
| 10 | 両ストアのデータ申告（位置情報・広告 ID・プッシュトークン）を直す | Play / ASC |

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
