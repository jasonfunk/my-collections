const IS_BETA = process.env.APP_VARIANT === 'beta';

module.exports = ({ config }) => ({
  ...config,
  name: IS_BETA ? 'My Collections Beta' : config.name,
  android: {
    ...config.android,
    package: IS_BETA ? 'com.mycollections.app.beta' : config.android.package,
  },
});
