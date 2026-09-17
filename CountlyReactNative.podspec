Pod::Spec.new do |s|
  s.name = 'CountlyReactNative'
  s.version = '26.1.0'
  s.license = {
    :type => 'COMMUNITY',
    :text => <<-LICENSE
              COUNTLY MOBILE ANALYTICS COMMUNITY EDITION LICENSE
              --------------------------------------------------

              Copyright (c) 2012, 2019 Countly

              Permission is hereby granted, free of charge, to any person obtaining a copy
              of this software and associated documentation files (the "Software"), to deal
              in the Software without restriction, including without limitation the rights
              to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
              copies of the Software, and to permit persons to whom the Software is
              furnished to do so, subject to the following conditions:

              The above copyright notice and this permission notice shall be included in
              all copies or substantial portions of the Software.

              THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
              IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
              AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
              LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
              OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
              THE SOFTWARE.
    LICENSE
  }
  s.summary  = 'Countly is an innovative, real-time, open source mobile analytics platform.'
  s.homepage = 'https://github.com/Countly/countly-sdk-react-native-bridge'
  s.social_media_url = 'https://twitter.com/gocountly'
  s.author = {'Countly' => 'hello@count.ly'}
  s.source = { :git => 'https://github.com/Countly/countly-sdk-react-native-bridge.git', :tag => s.version.to_s }
  s.source_files = 'ios/src/*.{h,m,swift}'
  s.preserve_paths = 'ios/src/countly_dsym_uploader.sh'
  s.requires_arc = true
  s.swift_version = '5.9'
  # The Countly Swift SDK's own floor. A lower target here is rejected when it is
  # built.
  s.ios.deployment_target = '15.0'

  # The Countly Swift SDK is resolved through Swift Package Manager, using the
  # helper React Native ships from 0.75 onwards. It is not a pod dependency: the
  # Swift SDK is not published to CocoaPods, and a podspec that cannot resolve
  # fails at "pod install" with a message that sends people to update their spec
  # repo for nothing.
  #
  # Pinned to a branch because countly-sdk-swift has no tags yet. Move to
  # {kind: 'upToNextMajorVersion', minimumVersion: '26.8.0'} once one is cut.
  # The helper is a private top-level method by the time a podspec is evaluated,
  # so it has to be looked up including private methods.
  if respond_to?(:spm_dependency, true)
    spm_dependency(s,
      url: 'https://github.com/Countly/countly-sdk-swift.git',
      requirement: { kind: 'branch', branch: 'pre-release' },
      products: ['Countly']
    )
  else
    raise 'countly-sdk-react-native-bridge needs React Native 0.75 or newer on iOS: ' \
          'the Countly Swift SDK is resolved through Swift Package Manager, and the ' \
          '"spm_dependency" helper that does it ships with react_native_pods.rb.'
  end

  s.dependency "React"
end
