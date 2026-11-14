/**
 * 地点の操作・旧データの読み替え・曇り判定は React Native に依存しない純粋な TypeScript なので、
 * jest-expo ではなく ts-jest で直接テストする。サーバー（server/）の判定ロジックもここで回す。
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/server/src/**/*.test.ts'],
  // Homebrew の watchman が壊れていると jest 起動時に落ちる（TripReady と同じ対処）
  watchman: false,
};
