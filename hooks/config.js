const config = {
  app_name: "AwesomeProject",
  app_dir: "/Users/trinisoft/office/countly/app/r4/AwesomeProject",
  isReactNative: true
};
config.android = {
  app_dir: config.app_dir +"/android",
};
config.ios = {
  app_dir: config.app_dir +"/ios",
}
module.exports = config;