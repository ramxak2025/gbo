module.exports = function (api) {
  api.cache(true);
  // Use expo's nested babel-preset-expo for Expo bundler
  // Jest uses its own transform config
  return {
    presets: [
      require('/home/user/gbo/mobile/node_modules/expo/node_modules/babel-preset-expo'),
    ],
  };
};
