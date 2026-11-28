#!/usr/bin/env bash
# Creates the device test app: the template app of one React Native version with the bridge, whose JavaScript runs
# every integration scenario of the example app (example/CountlyRNExample/testing) once it starts.
#
# Usage: .github/scripts/create-device-test-app.sh <android|ios> <react-native-version> <standard|no-push> <app-directory> [test-bundle-id]
#
# Run it from the repository root. The JavaScript is a development bundle (the Countly.test helpers work only there)
# stored in the app, so no Metro server is needed:
#   android: android/app/src/main/assets/index.android.bundle; build the debug APK afterwards.
#   ios:     the CountlyDeviceTests UI test bundle (e2e/ios) in ios/HelloWorld.xcodeproj, with the bundle and
#            scenarios.json as its resources; run pod install afterwards, with the same RCT_NEW_ARCH_ENABLED.
# e2e/scenarios.json in the app lists the scenario ids, one test case each.
set -euo pipefail

platform=${1:?android or ios}
version=${2:?react-native version}
package=${3:?standard or no-push}
app=${4:?app directory}
bundle_id=${5:-com.countly.CountlyTests}
repo=$(pwd)

.github/scripts/create-test-app.sh "$version" "$package" "$app"

mkdir -p "$app/e2e/testing"
cp e2e/index.js e2e/runner.js "$app/e2e/"
cp example/CountlyRNExample/testing/helpers.ts example/CountlyRNExample/testing/scenarios.ts "$app/e2e/testing/"
cp example/CountlyRNExample/Configuration.tsx "$app/e2e/"
# The scenarios import the package the app installed: the push or the no-push one.
bridge=$(node -p "Object.keys(require('$app/package.json').dependencies).find((name) => name.startsWith('countly-sdk-react-native-bridge'))")
BRIDGE="$bridge" perl -pi -e 's#(["'"'"'])countly-sdk-react-native-bridge(-np)?(?=["'"'"'/])#$1$ENV{BRIDGE}#g' \
  "$app/e2e/testing/helpers.ts" "$app/e2e/testing/scenarios.ts" "$app/e2e/Configuration.tsx"
# The iOS SDK stops the app on the placeholder app key, and the reserved .invalid domain keeps every request on the
# device, where the scenarios read it from the queue.
perl -pi -e 's#"https://your\.server\.ly"#"https://device-tests.invalid"#; s#"YOUR_APP_KEY"#"device-tests-app-key"#' "$app/e2e/Configuration.tsx"
grep -q '"https://device-tests.invalid"' "$app/e2e/Configuration.tsx"
grep -q '"device-tests-app-key"' "$app/e2e/Configuration.tsx"
printf 'import "./e2e/index";\n' > "$app/index.js"
# shellcheck disable=SC2016 # the single-quoted text is JavaScript for node, not for the shell
node -e '
const fs = require("fs");
const ids = [...fs.readFileSync(process.argv[1], "utf8").matchAll(/^\s+id: "([^"]+)",$/gm)].map((m) => m[1]);
if (ids.length === 0) { console.error("no scenario ids found"); process.exit(1); }
fs.writeFileSync(process.argv[2], JSON.stringify(ids, null, 2) + "\n");
console.log(`${ids.length} scenarios`);
' example/CountlyRNExample/testing/scenarios.ts "$app/e2e/scenarios.json"

cd "$app"
case "$platform" in
  android)
    # StrictMode reports main thread disk and network work, and leaked resources, to logcat (tag StrictMode), where
    # e2e/android/strictmode_audit.py reads them.
    main_application=android/app/src/main/java/com/helloworld/MainApplication.kt
    perl -0pi -e 's/(\n([ \t]*)super\.onCreate\(\)\n)/$1$2android.os.StrictMode.setThreadPolicy(android.os.StrictMode.ThreadPolicy.Builder().detectAll().penaltyLog().build())\n$2android.os.StrictMode.setVmPolicy(android.os.StrictMode.VmPolicy.Builder().detectAll().penaltyLog().build())\n/' "$main_application"
    grep -q "StrictMode.setThreadPolicy" "$main_application"
    mkdir -p android/app/src/main/assets
    npx react-native bundle --platform android --dev true --entry-file index.js \
      --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
    ;;
  ios)
    mkdir -p ios/CountlyDeviceTests
    cp "$repo/e2e/ios/CountlyDeviceTests.mm" e2e/scenarios.json ios/CountlyDeviceTests/
    npx react-native bundle --platform ios --dev true --entry-file index.js \
      --bundle-output ios/CountlyDeviceTests/main.jsbundle --assets-dest ios/CountlyDeviceTests
    ruby "$repo/e2e/ios/add-test-target.rb" ios/HelloWorld.xcodeproj "$bundle_id"
    # The test bundle links every pod of the app, because it starts React Native itself.
    perl -0pi -e "s/(target 'HelloWorld' do\n)/\$1  target 'CountlyDeviceTests' do\n    inherit! :complete\n  end\n\n/" ios/Podfile
    grep -q "target 'CountlyDeviceTests'" ios/Podfile
    # fmt of React Native 0.81 and older does not compile as C++20 with Xcode 26; apps compile it as C++17.
    if [ "$(echo "$version" | cut -d. -f2)" -le 81 ]; then
      cat > "$app/fmt.rb" <<'RUBY'
    installer.pods_project.targets.each do |target|
      next unless target.name == 'fmt'
      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
      end
    end
RUBY
      ADD="$app/fmt.rb" perl -0pi -e 'open(my $f, "<", $ENV{ADD}) or die; my $add = do { local $/; <$f> }; s/(\n[ \t]*react_native_post_install\(.*?\)\n)/$1$add/s' ios/Podfile
      grep -q "next unless target.name == 'fmt'" ios/Podfile
      rm "$app/fmt.rb"
    fi
    ;;
  *)
    echo "unknown platform $platform" >&2
    exit 2
    ;;
esac
echo "Created the $platform device test app with $bridge in $(pwd)"
