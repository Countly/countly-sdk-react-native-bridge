Pod::Spec.new do |s|
  s.name = 'CountlyReactNative'
  s.version = '26.1.0'
  s.license = { :type => 'MIT', :file => 'LICENSE' }
  s.summary  = 'Countly is an innovative, real-time, open source mobile analytics platform.'
  s.homepage = 'https://github.com/Countly/countly-sdk-react-native-bridge'
  s.social_media_url = 'https://twitter.com/gocountly'
  s.author = {'Countly' => 'hello@count.ly'}
  s.source = { :git => 'https://github.com/Countly/countly-sdk-react-native-bridge.git', :tag => s.version.to_s }
  s.requires_arc = true
  # The privacy bundle target inherits this; React Native 0.71+ defines its own minimum, which current Xcode accepts, unlike 10.0.
  s.ios.deployment_target = defined?(min_ios_version_supported) ? min_ios_version_supported : '10.0'
  s.osx.deployment_target = '10.14'
  s.watchos.deployment_target = '4.0'
  s.tvos.deployment_target = '10.0'
  s.static_framework = true
  s.default_subspecs = 'Core'

  s.subspec 'Core' do |core|
    core.source_files = 'ios/src/*.{h,m}'
    # The bridge headers plus the public headers of the bundled iOS SDK, the same list as ios/src/Countly.podspec.
    core.public_header_files = [
      'ios/src/CountlyReactNative.h',
      'ios/src/CountlyPushNotifications.h',
      'ios/src/CountlyNotificationService.h',
      'ios/src/Countly.h',
      'ios/src/CountlyUserDetails.h',
      'ios/src/CountlyConfig.h',
      'ios/src/CountlyFeedbackWidget.h',
      'ios/src/CountlyRCData.h',
      'ios/src/CountlyRemoteConfig.h',
      'ios/src/CountlyViewTracking.h',
      'ios/src/CountlyExperimentInformation.h',
      'ios/src/CountlyAPMConfig.h',
      'ios/src/CountlySDKLimitsConfig.h',
      'ios/src/Resettable.h',
      'ios/src/CountlyCrashesConfig.h',
      'ios/src/CountlyCrashData.h',
      'ios/src/CountlyContentBuilder.h',
      'ios/src/CountlyExperimentalConfig.h',
      'ios/src/CountlyContentConfig.h',
      'ios/src/CountlyFeedbacks.h'
    ]
    core.resource_bundles = { 'CountlyReactNative_Privacy' => ['ios/src/PrivacyInfo.xcprivacy'] }
    core.dependency 'React'
  end

  s.subspec 'NotificationService' do |ns|
    ns.source_files = 'ios/src/CountlyNotificationService.{m,h}'
    ns.ios.frameworks = ['Foundation', 'UserNotifications']
  end
end
