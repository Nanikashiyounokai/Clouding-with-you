import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, type MapPressEvent } from 'react-native-maps';

import { HomeButton, PrimaryButton, SecondaryButton, Sky, Title } from '../components/ui';
import { MAX_POINTS, round4, validate } from '../domain/points';
import { useStore } from '../store';
import { colors } from '../theme';

const TOKYO_STATION = { latitude: 35.6809591, longitude: 139.7673068 };

const ERRORS = {
  name: '登録名を入力してください',
  lat: '緯度は -90 度から 90 度の範囲で入力してください',
  lon: '経度は -180 度から 180 度の範囲で入力してください',
  full: `登録できるのは最大 ${MAX_POINTS} 地点です。必要のない登録地点を削除してください`,
} as const;

/**
 * 新規地点登録。
 * 旧版は緯度経度の手入力が主で、地図は別画面・初期位置は東京駅固定・地名検索なし だった。
 * 新版は地図を主にし、地名検索と現在地を地図の上に置く。緯度経度の直接入力は「詳しく」に下げた。
 */
export default function NewPoint() {
  const { points, active, add } = useStore();
  const map = useRef<MapView>(null);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [coord, setCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [busy, setBusy] = useState<null | 'search' | 'here'>(null);
  const [manual, setManual] = useState(false);
  const [latText, setLatText] = useState('');
  const [lonText, setLonText] = useState('');

  const start = active ? { latitude: active.lat, longitude: active.lon } : TOKYO_STATION;

  function place(latitude: number, longitude: number, zoom = true) {
    const c = { latitude: round4(latitude), longitude: round4(longitude) };
    setCoord(c);
    setLatText(String(c.latitude));
    setLonText(String(c.longitude));
    if (zoom) map.current?.animateToRegion({ ...c, latitudeDelta: 0.08, longitudeDelta: 0.08 }, 400);
  }

  async function ensureLocationPermission(): Promise<boolean> {
    const p = await Location.requestForegroundPermissionsAsync();
    if (!p.granted) Alert.alert('位置情報が使えません', '設定アプリで位置情報の利用を許可してください');
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
        Alert.alert('見つかりませんでした', '別の言い方で検索するか、地図をタップして選んでください');
        return;
      }
      place(hits[0].latitude, hits[0].longitude);
      if (!name.trim()) setName(q);
    } catch {
      Alert.alert('検索できませんでした', '通信状態を確認して、もう一度お試しください');
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
      Alert.alert('現在地を取得できませんでした', '位置情報をオンにしてしばらく待ってから、もう一度お試しください');
    } finally {
      setBusy(null);
    }
  }

  function onMapPress(e: MapPressEvent) {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    place(latitude, longitude, false);
  }

  function save() {
    const lat = manual ? latText : coord?.latitude ?? '';
    const lon = manual ? lonText : coord?.longitude ?? '';
    if (!manual && !coord) {
      Alert.alert('地点を選んでください', '地名で検索するか、地図をタップしてください');
      return;
    }
    const err = validate({ name, lat, lon }, points.length);
    if (err) {
      Alert.alert('登録できません', ERRORS[err]);
      return;
    }
    const first = points.length === 0;
    add({ name, lat: Number(lat), lon: Number(lon) });
    Alert.alert(
      '地点を登録しました',
      first ? `「${name.trim()}」で祈願を始めました。曇りそうなときにお知らせします` : '「登録地点」で祈願中にすると、曇りそうなときにお知らせします',
      [
        { text: 'タイトルに戻る', onPress: () => router.dismissTo('/') },
        { text: '登録地点を見る', onPress: () => router.replace('/points') },
      ],
    );
  }

  return (
    <Sky>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Title>新規地点登録</Title>
            <View style={styles.homeSlot}>
              <HomeButton />
            </View>
          </View>

          <Text style={styles.label}>登録名</Text>
          <TextInput value={name} onChangeText={setName} placeholder="例：自宅、新宿" placeholderTextColor={colors.inkSoft} style={styles.input} maxLength={30} returnKeyType="done" />

          <Text style={styles.label}>場所</Text>
          <View style={styles.row}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="地名や住所で検索"
              placeholderTextColor={colors.inkSoft}
              style={[styles.input, styles.grow]}
              returnKeyType="search"
              onSubmitEditing={search}
            />
            <Pressable accessibilityRole="button" onPress={search} style={styles.iconButton} disabled={busy !== null}>
              {busy === 'search' ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.iconText}>検索</Text>}
            </Pressable>
          </View>

          <View style={styles.mapWrap}>
            <MapView
              ref={map}
              style={styles.map}
              initialRegion={{ ...start, latitudeDelta: 0.3, longitudeDelta: 0.3 }}
              onPress={onMapPress}
              showsUserLocation={false}
              toolbarEnabled={false}
            >
              {coord && <Marker coordinate={coord} />}
            </MapView>
            <Pressable accessibilityRole="button" onPress={here} style={styles.hereButton} disabled={busy !== null}>
              {busy === 'here' ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.iconText}>現在地</Text>}
            </Pressable>
          </View>
          <Text style={styles.hint}>{coord ? `緯度 ${coord.latitude}　経度 ${coord.longitude}` : '地図をタップしても選べます'}</Text>

          <Pressable onPress={() => setManual((v) => !v)} accessibilityRole="button">
            <Text style={styles.link}>{manual ? '▲ 緯度・経度の直接入力を閉じる' : '▼ 緯度・経度を直接入力する'}</Text>
          </Pressable>
          {manual && (
            <View style={styles.row}>
              <TextInput value={latText} onChangeText={setLatText} placeholder="緯度" placeholderTextColor={colors.inkSoft} style={[styles.input, styles.grow]} keyboardType="numbers-and-punctuation" />
              <TextInput value={lonText} onChangeText={setLonText} placeholder="経度" placeholderTextColor={colors.inkSoft} style={[styles.input, styles.grow]} keyboardType="numbers-and-punctuation" />
            </View>
          )}

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
  body: { paddingHorizontal: 16, paddingBottom: 32, gap: 8 },
  header: { justifyContent: 'center' },
  homeSlot: { position: 'absolute', right: 0 },
  label: { color: colors.text, fontWeight: 'bold', marginTop: 8 },
  input: { backgroundColor: colors.card, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: colors.ink },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  grow: { flex: 1 },
  iconButton: { backgroundColor: colors.card, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, minWidth: 64, alignItems: 'center' },
  iconText: { color: colors.ink, fontWeight: 'bold' },
  mapWrap: { height: 300, borderRadius: 10, overflow: 'hidden', marginTop: 4 },
  map: { flex: 1 },
  hereButton: { position: 'absolute', right: 10, bottom: 10, backgroundColor: colors.card, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  hint: { color: colors.textSoft, fontSize: 13 },
  link: { color: colors.text, fontSize: 13, textDecorationLine: 'underline', marginTop: 4 },
  actions: { gap: 10, marginTop: 16 },
});
