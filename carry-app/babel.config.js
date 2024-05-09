module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  env: {
    production: {
      plugins: ['transform-remove-console'],
    },
  },
  plugins: [
    'react-native-reanimated/plugin',
    // 'transform-remove-console',
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: ['.ios.ts', '.android.ts', '.ts', '.ios.tsx', '.android.tsx', '.tsx', '.jsx', '.js', '.json'],
        alias: {
          '@scenes': './src/scenes',
          '@components': './src/components',
          '@assets': './src/assets',
          '@redux': './src/redux',
          '@shared': './src/shared',
          '@hooks': './src/hooks',
          '@dts': './src/dts',
        },
      },
    ],
  ],
}
