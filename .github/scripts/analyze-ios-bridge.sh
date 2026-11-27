#!/usr/bin/env bash
# Runs the Clang Static Analyzer on the iOS bridge of one source tree and writes its findings as SARIF.
#
# Usage: .github/scripts/analyze-ios-bridge.sh <source-tree> <sarif-directory> <app-directory>
#
# The bridge builds only inside an app, so this creates the React Native $REACT_NATIVE template app with the bridge
# packed from <source-tree> (this checkout, or the base branch for a comparison), turns the analyzer on for the
# CountlyReactNative pod only, and builds the app for the simulator. The pod also compiles the copied iOS SDK, which
# its own repository analyses, so only the reports of the bridge's own sources are kept.
set -euo pipefail

source_tree=$(cd "${1:?source tree}" && pwd)
sarif=${2:?SARIF directory}
app=${3:?app directory}
scripts=$(cd "$(dirname "$0")" && pwd)

(cd "$source_tree" && "$scripts/create-test-app.sh" "${REACT_NATIVE:?}" standard "$app")
mkdir -p "$sarif"
raw=$(mktemp -d)

cat > "$raw/analyzer.rb" <<'RUBY'
    installer.pods_project.targets.each do |target|
      next unless target.name == 'CountlyReactNative'
      target.build_configurations.each do |config|
        config.build_settings['RUN_CLANG_STATIC_ANALYZER'] = 'YES'
        config.build_settings['CLANG_STATIC_ANALYZER_MODE'] = 'deep'
        config.build_settings['CLANG_ANALYZER_OUTPUT'] = 'sarif'
        config.build_settings['CLANG_ANALYZER_OUTPUT_DIR'] = ENV.fetch('ANALYZER_OUTPUT')
      end
    end
RUBY
ADD="$raw/analyzer.rb" perl -0pi -e 'open(my $f, "<", $ENV{ADD}) or die; my $add = do { local $/; <$f> }; s/(\n[ \t]*react_native_post_install\(.*?\)\n)/$1$add/s' "$app/ios/Podfile"
grep -q "RUN_CLANG_STATIC_ANALYZER" "$app/ios/Podfile"

(cd "$app/ios" && ANALYZER_OUTPUT="$raw/out" pod install)
(cd "$app/ios" && xcodebuild build \
  -workspace HelloWorld.xcworkspace -scheme HelloWorld -configuration Debug \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  ARCHS=arm64 CODE_SIGNING_ALLOWED=NO > "$raw/build.log") || { tail -n 80 "$raw/build.log"; exit 1; }

# Xcode names each report after its source file and gives it the .plist extension, whatever its format; the
# .plist.scan files next to them are its own binary records.
echo "Analyzer reports:"
find "$raw/out" -type f -name '*.plist' | sed "s#^$raw/out/##"
find "$raw/out" -type f \( -name 'CountlyReactNative.plist' -o -name 'CountlyRNPushNotifications.plist' \) | while read -r report; do
  cp "$report" "$sarif/$(basename "${report%.*}").sarif"
done
ls -l "$sarif"
