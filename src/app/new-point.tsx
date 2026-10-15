import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import MapView, { Marker, type MapPressEvent } from 'react-native-maps';

import { useDialog } from '../components/Dialog';
import { Header, PrimaryButton, SecondaryButton, Sky, T } from '../components/ui';
import { MAX_POINTS, round4, validate } from '../domain/points';
import { useStore } from '../store';
import { colors, fonts } from '../theme';

const TOKYO_STATION = { latitude: 35.6809591, longitude: 139.7673068 };

const ERRORS = {
  name: { title: '登録名を入れてください', message: '自宅、新宿など\nわかりやすい名前を付けてください。' },
  lat: { title: '地点を選んでください', message: '地名で探すか、\n地図をタップして選んでください。' },
  lon: { title: '地点を選んでください', message: '地名で探すか、\n地図をタップして選んでください。' },
  full: { title: `登録できるのは${MAX_POINTS}地点までです`, message: '使わなくなった地点を\n「登録地点」から削除してください。' },
} as const;

/**
 * 新規地点登録。地名で探すか、地図をタップするか、現在地で選ぶ。
 * 旧版にあった緯度経度の直接入力はなくした（2026-10-15）。
 */
export default function NewPoint() {
  const { points, active, add } = useStore();
  const dialog = useDialog();
  const map = useRef<MapView>(null);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [coord, setCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [busy, setBusy] = useState<null | 'search' | 'here'>(null);

  const start = active ? { latitude: active.lat, longitude: active.lon } : TOKYO_STATION;

  function place(latitude: number, longitude: number, zoom = true) {
    const c = { latitude: round4(latitude), longitude: round4(longitude) };
    setCoord(c);
    if (zoom) map.current?.animateToRegion({ ...c, latitudeDelta: 0.08, longitudeDelta: 0.08 }, 400);
  }

  async function ensureLocationPermission(): Promise<boolean> {
    const p = await Location.requestForegroundPermissionsAsync();
    if (!p.granted) dialog.show({ title: '位置情報が使えません', message: '設定アプリで\n位置情報の利用を許可してください。' });
    return p.granted;
  }

  async function search() {
    const q = query.trim();
    if (!q) return;
    Keyboard.dismiss();
    setBusy('search');
    try {
      // Android の地名検索は位置情報の許可が要る
      if (Platform.OS === 'android' && !(await ensureLocationPermission())) return;
      const hits = await Location.geocodeAsync(q);
      if (!hits.length) {
        dialog.show({ title: '見つかりませんでした', message: '別の言い方で探すか、\n地図をタップして選んでください。' });
        return;
      }
      place(hits[0].latitude, hits[0].longitude);
      if (!name.trim()) setName(q);
    } catch {
      dialog.show({ title: '探せませんでした', message: '通信できる状態で\nもう一度お試しください。' });
    } finally {
      setBusy(null);
    }
  }

  async function here() {
    setBusy('here');
    try {
      if (!(await ensureLocationPermission())) return;
      // 旧版は lastLocation（キャッシュ）だけを見ていて、無いと null で落ちていた
      const pos =
        (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      place(pos.coords.latitude, pos.coords.longitude);
      if (!name.trim()) {
        const [addr] = await Location.reverseGeocodeAsync(pos.coords).catch(() => []);
        const label = addr?.city ?? addr?.subregion ?? addr?.region;
        if (label) setName(label);
      }
    } catch {
      dialog.show({ title: '現在地がわかりませんでした', message: '位置情報をオンにして\nしばらく待ってからお試しください。' });
    } finally {
      setBusy(null);
    }
  }

  function onMapPress(e: MapPressEvent) {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    place(latitude, longitude, false);
  }

  function save() {
    const err = validate({ name, lat: coord?.latitude ?? '', lon: coord?.longitude ?? '' }, points.length);
    if (err) {
      dialog.show(ERRORS[err]);
      return;
    }
    if (!coord) return;
    const first = points.length === 0;
    add({ name, lat: coord.latitude, lon: coord.longitude });
    dialog.show({
      title: '地点を登録しました',
      message: first ? `「${name.trim()}」で祈願を始めました。\n曇りそうなときにお知らせします。` : '「登録地点」で祈願すると、\n曇りそうなときにお知らせします。',
      buttons: [
        { label: '登録地点を見る', kind: 'primary', onPress: () => router.replace('/points') },
        { label: 'タイトルに戻る', kind: 'secondary', onPress: () => router.dismissTo('/') },
      ],
    });
  }

  return (
    <Sky>
      <Header title="新規地点登録" />
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <T bold style={styles.label}>
            登録名
          </T>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="例　自宅、新宿"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            maxLength={30}
            returnKeyType="done"
          />

          <T bold style={styles.label}>
            場所
          </T>
          <View style={styles.searchRow}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="地名や住所で探す"
              placeholderTextColor={colors.inkSoft}
              style={[styles.input, styles.grow]}
              returnKeyType="search"
              onSubmitEditing={search}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="探す" onPress={search} style={styles.iconButton} disabled={busy !== null}>
              {busy === 'search' ? <ActivityIndicator color={colors.blueDeep} /> : <Ionicons name="search" size={20} color={colors.blueDeep} />}
            </Pressable>
          </View>

          <View style={styles.mapWrap}>
            <MapView ref={map} style={styles.map} initialRegion={{ ...start, latitudeDelta: 0.3, longitudeDelta: 0.3 }} onPress={onMapPress} toolbarEnabled={false}>
              {coord && <Marker coordinate={coord} pinColor={colors.blue} />}
            </MapView>
            <Pressable accessibilityRole="button" onPress={here} style={styles.hereButton} disabled={busy !== null}>
              {busy === 'here' ? <ActivityIndicator color={colors.blueDeep} /> : <Ionicons name="locate" size={16} color={colors.blueDeep} />}
              <T bold style={styles.hereText}>
                現在地
              </T>
            </Pressable>
          </View>
          <T style={styles.hint}>地図をタップしても選べます</T>

          <View style={styles.actions}>
            <PrimaryButton label="この地点を登録する" onPress={save} />
            <SecondaryButton label="登録地点を見る" onPress={() => router.replace('/points')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Sky>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  body: { paddingHorizontal: 20, paddingBottom: 32, gap: 8 },
  label: { fontSize: 15, lineHeight: 23, marginTop: 8 },
  input: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
    fontFamily: fonts.regular,
  },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  grow: { flex: 1 },
  iconButton: { backgroundColor: colors.card, borderRadius: 14, width: 52, height: 50, alignItems: 'center', justifyContent: 'center' },
  mapWrap: { height: 300, borderRadius: 18, overflow: 'hidden', marginTop: 4 },
  map: { flex: 1 },
  hereButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  hereText: { color: colors.blueDeep, fontSize: 14, lineHeight: 20 },
  hint: { color: colors.whiteSoft, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  actions: { gap: 12, marginTop: 20 },
});
