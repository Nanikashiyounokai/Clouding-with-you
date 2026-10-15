/**
 * 白と青。空のグラデーションは旧版の gradient_background.xml（上 #3f8acc → 下 #99cfff）をそのまま使う。
 * 文字はすべて明朝（しっぽり明朝）。太字は合成させず Bold の書体を使う
 * （Android で合成の太字を使うと、行末の文字が欠けることがある）。
 */
export const colors = {
  skyTop: '#3F8ACC',
  skyBottom: '#99CFFF',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.86)',
  /** 白い面の上の文字 */
  ink: '#1E3A55',
  inkSoft: '#5B7590',
  /** 雲のボタンの文字（旧版の灰色を少し青に寄せた） */
  cloudInk: '#4A6782',
  blue: '#3F8ACC',
  blueDeep: '#2A6BA8',
  card: 'rgba(255,255,255,0.94)',
  line: 'rgba(30,58,85,0.14)',
  danger: '#B6453C',
  scrim: 'rgba(16,44,72,0.45)',
};

export const fonts = {
  regular: 'Mincho',
  bold: 'MinchoBold',
};
