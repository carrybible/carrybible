module.exports = {
  project: {
    ios: {},
    android: {}, // grouped into "project"
  },
  assets: ['./src/assets/fonts'],
  dependencies: {
    '@carrybible/react-native-sqlite-storage': {
      platforms: {
        android: {
          sourceDir: '../node_modules/@carrybible/react-native-sqlite-storage/platforms/android-native',
          packageImportPath: 'import io.liteglue.SQLitePluginPackage;',
          packageInstance: 'new SQLitePluginPackage()',
        },
      },
    },
  },
  // assets: ['./src/assets/videos'], // stays the same
}
