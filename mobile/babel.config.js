module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@components': './components',
            '@screens': './app',
            '@store': './store',
            '@services': './services',
            '@types': './types',
            '@constants': './constants',
            '@hooks': './hooks',
            '@utils': './utils',
          },
        },
      ],
    ],
  };
};
