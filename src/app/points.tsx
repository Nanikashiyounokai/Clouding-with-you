import { router } from 'expo-router';
import { Alert, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { HomeButton, PrimaryButton, Sky, Title } from '../components/ui';
import type { Point } from '../domain/points';
import { useStore, type NotifyStatus } from '../store';
import { colors } from '../theme';

/** 通知が届かない理由。祈願中の地点があるときだけ出す */
const NOTICE: Partial<Record<NotifyStatus, { text: string; settings?: boolean }>> = {
  denied: { text: '通知が許可されていないため、曇りのお知らせが届きません。', settings: true },
  offline: { text: 'お知らせの登録ができませんでした。通信できる状態でアプリを開き直してください。' },
  failed: { text: 'お知らせの登録ができませんでした。時間をおいてアプリを開き直してください。' },
};

export default function Points() {
  const { points, active, notify, toggle, remove } = useStore();
  const notice = active ? NOTICE[notify] : undefined;

  function openDetail(p: Point) {
    Alert.alert(`「${p.name}」`, `緯度 ${p.lat}　経度 ${p.lon}`, [
      { text: '削除', style: 'destructive', onPress: () => confirmRemove(p) },
      { text: '戻る', style: 'cancel' },
    ]);
  }

  function confirmRemove(p: Point) {
    Alert.alert('削除しますか', `「${p.name}」を登録地点から削除します`, [
      { text: 'やめる', style: 'cancel' },
      { text: '削除する', style: 'destructive', onPress: () => remove(p.id) },
    ]);
  }

  return (
    <Sky>
      <View style={styles.header}>
        <Title>登録地点</Title>
        <View style={styles.homeSlot}>
          <HomeButton />
        </View>
      </View>

      {notice && (
        <Pressable onPress={notice.settings ? () => Linking.openSettings() : undefined} style={styles.notice} accessibilityRole={notice.settings ? 'button' : undefined}>
          <Text style={styles.noticeText}>
            {notice.text}
            {notice.settings ? '（タップで設定を開く）' : ''}
          </Text>
        </Pressable>
      )}

      <FlatList
        data={points}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>登録地点がありません</Text>}
        ListHeaderComponent={points.length ? <Text style={styles.help}>祈願中の地点が曇りそうなとき、お知らせします。○ を押して切り替えます。</Text> : null}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => openDetail(item)} accessibilityRole="button" accessibilityHint="詳細と削除">
            <View style={styles.grow}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.coord}>
                緯度 {item.lat}　経度 {item.lon}
              </Text>
            </View>
            <Pressable
              onPress={() => toggle(item.id)}
              hitSlop={10}
              accessibilityRole="radio"
              accessibilityState={{ checked: item.active }}
              accessibilityLabel={`${item.name}で祈願する`}
              style={styles.radioWrap}
            >
              {item.active && <Text style={styles.praying}>祈願中</Text>}
              <View style={[styles.radio, item.active && styles.radioOn]}>{item.active && <View style={styles.dot} />}</View>
            </Pressable>
          </Pressable>
        )}
      />

      <View style={styles.footer}>
        <PrimaryButton label="新規地点登録" onPress={() => router.replace('/new-point')} />
      </View>
    </Sky>
  );
}

const styles = StyleSheet.create({
  header: { justifyContent: 'center', paddingHorizontal: 16 },
  homeSlot: { position: 'absolute', right: 16 },
  notice: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#FFF4E5', borderRadius: 8, padding: 12 },
  noticeText: { color: '#7A4A00', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  help: { color: colors.textSoft, fontSize: 13, marginBottom: 4 },
  empty: { color: colors.text, textAlign: 'center', marginTop: 48, fontSize: 16 },
  card: { backgroundColor: colors.card, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1 },
  name: { color: colors.ink, fontSize: 17, fontWeight: 'bold' },
  coord: { color: colors.inkSoft, fontSize: 13, marginTop: 2 },
  radioWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  praying: { color: colors.accent, fontWeight: 'bold', fontSize: 13 },
  radio: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.inkSoft, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.accent },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.accent },
  footer: { paddingHorizontal: 16, paddingBottom: 12 },
});
