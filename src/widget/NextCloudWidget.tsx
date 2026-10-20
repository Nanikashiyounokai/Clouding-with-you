import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';


/** ホーム画面ウィジェット（Android）。中身は widget/index.tsx の readWidgetData で決める */
export const WIDGET_NAME = 'NextCloud';

export type WidgetData =
  | { kind: 'start' } // まだ同意していない
  | { kind: 'no-point' } // 祈願中の地点が無い
  | { kind: 'point'; name: string; lat: number; lon: number; nextOnset: number | null };

const font = { regular: 'WidgetMincho', bold: 'WidgetMinchoBold' };
/** theme.ts と同じ色。ウィジェットの型は色を文字列リテラルで受けるのでここに写す */
const colors = { skyTop: '#3F8ACC', skyBottom: '#99CFFF', white: '#FFFFFF', whiteSoft: 'rgba(255, 255, 255, 0.86)' } as const;

function when(at: number, now = new Date()): string {
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, '0');
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(d) - day(now)) / 86_400_000);
  const date = diff === 0 ? '今日' : diff === 1 ? '明日' : `${d.getMonth() + 1}月${d.getDate()}日`;
  return `${date} ${p(d.getHours())}:${p(d.getMinutes())}ごろ`;
}

export function NextCloudWidget({ data }: { data: WidgetData }) {
  const top = data.kind === 'point' ? `${data.name}の上空` : '曇天気の娘';
  const lead = data.kind === 'point' && data.nextOnset !== null ? '次に曇りそうなのは' : null;
  const main =
    data.kind === 'start'
      ? 'アプリを開いて始めてください'
      : data.kind === 'no-point'
        ? '祈願する地点を登録してください'
        : data.nextOnset !== null
          ? when(data.nextOnset)
          : 'しばらく曇りの予報はありません';
  const big = lead !== null;
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        borderRadius: 22,
        backgroundGradient: { from: colors.skyTop, to: colors.skyBottom, orientation: 'TOP_BOTTOM' },
        paddingHorizontal: 18,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <FlexWidget style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
        <TextWidget text={top} maxLines={1} truncate="END" style={{ fontFamily: font.regular, fontSize: 13, color: colors.whiteSoft }} />
        {lead !== null && (
          <TextWidget text={lead} style={{ fontFamily: font.regular, fontSize: 12, color: colors.white, marginTop: 6 }} />
        )}
        <TextWidget
          text={main}
          maxLines={2}
          style={{ fontFamily: font.bold, fontSize: big ? 22 : 15, color: colors.white, marginTop: big ? 2 : 8 }}
        />
      </FlexWidget>
      <ImageWidget image={require('../../assets/images/cloud_button.png')} imageWidth={84} imageHeight={30} />
    </FlexWidget>
  );
}
