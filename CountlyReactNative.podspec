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
  # The bundled iOS SDK needs iOS 15, tvOS 15, macOS 12 and watchOS 9. React Native 0.71+ defines its own iOS minimum,
  # which is used when it is higher; the privacy bundle target inherits this.
  countly_min_ios = '15.0'
  rn_min_ios = defined?(min_ios_version_supported) ? min_ios_version_supported.to_s : countly_min_ios
  s.ios.deployment_target = Gem::Version.new(rn_min_ios) > Gem::Version.new(countly_min_ios) ? rn_min_ios : countly_min_ios
  s.osx.deployment_target = '12.0'
  s.watchos.deployment_target = '9.0'
  s.tvos.deployment_target = '15.0'
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
    core.pod_target_xcconfig = { 'GCC_PREPROCESSOR_DEFINITIONS' => '$(inherited) COUNTLY_EXCLUDE_PUSHNOTIFICATIONS=1' }
    core.dependency 'React'
  end
end
