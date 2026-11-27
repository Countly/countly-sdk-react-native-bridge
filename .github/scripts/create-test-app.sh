#!/usr/bin/env bash
# Creates a React Native app from the app template of one React Native version and installs the packed bridge in it.
#
# Usage: .github/scripts/create-test-app.sh <react-native-version> <standard|no-push> <app-directory>
#
# Run it from the repository root. The app is the template's "HelloWorld" app: workspace ios/HelloWorld.xcworkspace,
# scheme HelloWorld, Android application ID com.helloworld. Its index.js imports the bridge, so a release build bundles
# the bridge's JavaScript too. The app gets only the changes an app on that React Native version needs for the bridge
# (iOS 15, Android API 21), plus the fixes old templates need on today's build machines.
# BRIDGE_PACKAGE installs a published bridge instead of this repository's, for example
# countly-sdk-react-native-bridge@26.1.0.
set -euo pipefail

version=${1:?react-native version}
package=${2:?standard or no-push}
app=${3:?app directory}
minor=$(echo "$version" | cut -d. -f2)
work=$(mktemp -d)

if [ -n "${BRIDGE_PACKAGE:-}" ]; then
  tarball=$BRIDGE_PACKAGE
  bridge=${BRIDGE_PACKAGE%@*}
else
  source=.
  # The no-push branch has no generator, because it already is the no-push package.
  if [ "$package" = no-push ] && [ -f scripts/generate-no-push.js ]; then
    node scripts/generate-no-push.js "$work/no-push"
    source="$work/no-push"
  fi
  tarball="$work/$(npm pack "$source" --pack-destination "$work" | tail -n 1)"
  # The no-push package has its own name.
  bridge=$(tar -xzOf "$tarball" package/package.json | node -e 'let s="";process.stdin.on("data",(d)=>{s+=d;}).on("end",()=>{process.stdout.write(JSON.parse(s).name);})')
fi

# React Native 0.75 moved the template out of the react-native package.
if [ "$minor" -ge 75 ]; then
  template="@react-native-community/template@$version"
else
  template="react-native@$version"
fi
template_file=$(cd "$work" && npm pack "$template" --silent | tail -n 1)
mkdir -p "$work/template"
tar -xzf "$work/$template_file" -C "$work/template"
mkdir -p "$app"
cp -R "$work/template/package/template/." "$app/"
cd "$app"

# The template stores dot files with a leading underscore, as the CLI expects.
find . -depth -name '_[a-zA-Z]*' | while read -r path; do
  mv "$path" "$(dirname "$path")/.$(basename "$path" | cut -c2-)"
done

cat >> index.js <<EOF

import Countly from '$bridge';
import CountlyConfig from '$bridge/CountlyConfig';

global.countlyBuildCheck = [Countly, CountlyConfig];
EOF

install_flags="--no-audit --no-fund"
if [ "$minor" -lt 71 ]; then
  install_flags="$install_flags --legacy-peer-deps"
fi
# shellcheck disable=SC2086
npm install $install_flags
# shellcheck disable=SC2086
npm install $install_flags "$tarball"

# The bundled Android SDK needs API 21.
perl -pi -e 's/minSdkVersion = (1[0-9]|20)\b/minSdkVersion = 21/' android/build.gradle

# The bundled iOS SDK needs iOS 15. React Native 0.76 and newer already ask for 15.1.
if [ "$minor" -lt 76 ]; then
  perl -pi -e "s/^platform :ios, .*/platform :ios, '15.1'/" ios/Podfile
fi

# Flipper does not build with the Xcode versions that build iOS 15 apps, and it is only a debug tool.
perl -ni -e 'print unless /^\s*(use_flipper!|add_flipper_pods!|flipper_post_install)/' ios/Podfile
perl -pi -e 's/FlipperConfiguration\.enabled/FlipperConfiguration.disabled/' ios/Podfile

# Boost moved its downloads away from JFrog, so the podspec of React Native 0.64 to 0.69 points at a dead address.
boost=node_modules/react-native/third-party-podspecs/boost.podspec
if [ -f "$boost" ]; then
  perl -pi -e 's#https://boostorg\.jfrog\.io/artifactory/main/release/#https://archives.boost.io/release/#' "$boost"
fi

# Boost of React Native 0.70 and older uses std::unary_function, which the C++ library of Xcode 15 and newer removed.
if [ "$minor" -lt 71 ]; then
  cat > "$work/unary.rb" <<'RUBY'
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = ['$(inherited)', '_LIBCPP_ENABLE_CXX17_REMOVED_UNARY_BINARY_FUNCTION']
      end
    end
RUBY
  ADD="$work/unary.rb" perl -0pi -e 'open(my $f, "<", $ENV{ADD}) or die; my $add = do { local $/; <$f> }; s/(post_install do \|installer\|\n)/$1$add/' ios/Podfile
  grep -q _LIBCPP_ENABLE_CXX17_REMOVED_UNARY_BINARY_FUNCTION ios/Podfile
fi

# Yoga of React Native 0.67 and older does not compile with Xcode 14.3 and newer (-Wbitwise-instead-of-logical);
# apps on those versions apply this one-character fix.
yoga=node_modules/react-native/ReactCommon/yoga/yoga/Yoga.cpp
if [ -f "$yoga" ]; then
  perl -0pi -e 's/hadOverflow\(\) \|\n/hadOverflow() ||\n/g' "$yoga"
fi

echo "Created $(pwd) with React Native $version and $(basename "$tarball")"
