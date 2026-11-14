import { registerWidgetTaskHandler } from 'react-native-android-widget';

// 裏での取り直し（defineTask）とウィジェットの処理は、画面より先に必ず読み込む
import './src/clouds/background';
import { widgetTaskHandler } from './src/widget';
import 'expo-router/entry';

registerWidgetTaskHandler(widgetTaskHandler);
