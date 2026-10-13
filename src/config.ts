import Constants from 'expo-constants';

/**
 * 曇り通知サーバー（server/）の URL。app.json の extra.apiBaseUrl。
 * 空のあいだは地点の登録だけ動き、通知は届かない（Workers をデプロイしたら入れる）。
 */
export const apiBaseUrl: string = (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? '';

/** Expo のプッシュトークン取得に要る。`eas init` で app.json の extra.eas.projectId に入る */
export const easProjectId: string | undefined =
  (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ?? Constants.easConfig?.projectId;
