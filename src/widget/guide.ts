import { Platform } from 'react-native';

import { pinWidget } from './index';

type DialogShow = (o: {
  title: string;
  message?: string;
  buttons?: { label: string; kind?: 'primary' | 'secondary' | 'danger'; onPress?: () => void }[];
}) => void;

/** iOS はアプリから置けないので、置き方を見せる */
export const IOS_WIDGET_STEPS =
  '1. ホーム画面の何もないところを長押し\n2. 左上の「編集」→「ウィジェットを追加」\n　（または左上の「＋」）\n3.「曇天気の娘」を選んで追加';

/** ウィジェットを置いてもらう。Android は OS の確認を出し、iOS は置き方を見せる */
export function offerWidget(show: DialogShow, after?: () => void): void {
  if (Platform.OS === 'android') {
    pinWidget().finally(() => after?.());
    return;
  }
  show({ title: 'ホーム画面に置くには', message: IOS_WIDGET_STEPS, buttons: [{ label: 'わかりました', kind: 'primary', onPress: after }] });
}
