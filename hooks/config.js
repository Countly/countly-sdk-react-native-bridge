const app_dir = __dirname +'/../../..';
// app_dir = "/Users/trinisoft/office/countly/app/r4/AwesomeProject";
const appJSON = require(app_dir +'/app.json');
const app_name = appJSON.name;
const config = {
  app_name: app_name,
  app_dir: app_dir,
  isReactNative: true
};
config.android = {
  app_dir: config.app_dir +"/android",
};
config.ios = {
  app_dir: config.app_dir +"/ios",
}
module.exports = config;