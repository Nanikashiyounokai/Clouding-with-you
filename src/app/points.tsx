import { router } from 'expo-router';
import { FlatList, Linking, Pressable, StyleSheet, View } from 'react-native';

import { AdBanner } from '../ads/AdsProvider';
import { useDialog } from '../components/Dialog';
import { BackToTitle, Header, PrimaryButton, Sky, T } from '../components/ui';
import type { Point } from '../domain/points';
import { useStore, type NotifyStatus } from '../store';
import { colors } from '../theme';

/** 通知が届かない理由。祈願中の地点があるときだけ出す */
const NOTICE: Partial<Record<NotifyStatus, { text: string; settings?: boolean }>> = {
  denied: { text: '通知が許可されていないため、\n曇りのお知らせが届きません。', settings: true },
  offline: { text: '天気予報を受け取れませんでした。\n通信できる状態で開き直してください。' },
};

/** 祈願中の地点で次に曇りそうな時刻 */
function describeNext(at: number | null, now = new Date()): string {
  if (at === null) return 'しばらく曇りの予報はありません';
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, '0');
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(d) - day(now)) / 86_400_000);
  const when = diff === 0 ? '今日' : diff === 1 ? '明日' : `${d.getMonth() + 1}月${d.getDate()}日`;
  return `次に曇りそうなのは ${when} ${p(d.getHours())}:${p(d.getMinutes())}ごろ`;
}

export default function Points() {
  const { points, active, notify, nextCloud, toggle, remove } = useStore();
  const dialog = useDialog();
  const notice = active ? NOTICE[notify] : undefined;

  function openDetail(p: Point) {
    dialog.show({
      title: `「${p.name}」`,
      message: p.active ? describeNext(nextCloud) : '祈願すると、\n曇りそうなときにお知らせします。',
      buttons: [
        { label: '戻る', kind: 'primary' },
        { label: 'この地点を削除する', kind: 'danger', onPress: () => confirmRemove(p) },
      ],
    });
  }

  function confirmRemove(p: Point) {
    dialog.show({
      title: '削除しますか',
      message: `「${p.name}」を\n登録地点から削除します。`,
      buttons: [
        { label: 'やめる', kind: 'primary' },
        { label: '削除する', kind: 'danger', onPress: () => remove(p.id) },
      ],
    });
  }

  return (
    <Sky>
      <Header title="登録地点" />

      {notice && (
        <Pressable onPress={notice.settings ? () => Linking.openSettings() : undefined} style={styles.notice} accessibilityRole={notice.settings ? 'button' : undefined}>
          <T style={styles.noticeText}>{notice.text}</T>
          {notice.settings && (
            <T bold style={styles.noticeLink}>
              設定を開く
            </T>
          )}
        </Pressable>
      )}

      <FlatList
        data={points}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <T style={styles.empty}>
            {'登録地点がありません。\n新規地点登録から追加してください。'}
          </T>
        }
        ListHeaderComponent={
          points.length ? (
            <T style={styles.help}>{'祈願する地点を一つ選ぶと、\n曇りそうなときにお知らせします。'}</T>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]} onPress={() => openDetail(item)} accessibilityRole="button" accessibilityHint="詳細と削除">
            <View style={styles.grow}>
              <T bold style={styles.name} numberOfLines={1}>
                {item.name}
              </T>
              {item.active && <T style={styles.cloud}>{describeNext(nextCloud)}</T>}
            </View>
            <Pressable
              onPress={() => toggle(item.id)}
              hitSlop={8}
              accessibilityRole="switch"
              accessibilityState={{ checked: item.active }}
              accessibilityLabel={`${item.name}で祈願する`}
              style={[styles.pray, item.active && styles.prayOn]}
            >
              <T bold style={[styles.prayText, item.active && styles.prayTextOn]}>
                {item.active ? '祈願中' : '祈願する'}
              </T>
            </Pressable>
          </Pressable>
        )}
      />

      <View style={styles.footer}>
        <PrimaryButton label="新規地点登録" onPress={() => router.replace('/new-point')} />
        <BackToTitle />
      </View>
      <AdBanner />
    </Sky>
  );
}

const styles = StyleSheet.create({
  notice: { marginHorizontal: 20, marginBottom: 8, backgroundColor: colors.card, borderRadius: 14, padding: 14, alignItems: 'center' },
  noticeText: { color: colors.ink, fontSize: 13, lineHeight: 21, textAlign: 'center' },
  noticeLink: { color: colors.blueDeep, fontSize: 13, lineHeight: 21, marginTop: 4, textDecorationLine: 'underline' },
  list: { paddingHorizontal: 20, paddingBottom: 16, gap: 12, flexGrow: 1 },
  help: { color: colors.whiteSoft, fontSize: 14, lineHeight: 23, textAlign: 'center', marginBottom: 4 },
  empty: { textAlign: 'center', marginTop: 64, fontSize: 16, lineHeight: 28 },
  card: { backgroundColor: colors.card, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1 },
  name: { color: colors.ink, fontSize: 18, lineHeight: 27 },
  cloud: { color: colors.inkSoft, fontSize: 13, lineHeight: 21, marginTop: 2 },
  pray: { borderRadius: 18, borderWidth: 1, borderColor: colors.blue, paddingHorizontal: 14, paddingVertical: 6 },
  prayOn: { backgroundColor: colors.blue },
  prayText: { color: colors.blueDeep, fontSize: 13, lineHeight: 20 },
  prayTextOn: { color: colors.white },
  footer: { paddingHorizontal: 20, paddingBottom: 4, paddingTop: 4, gap: 4 },
});
