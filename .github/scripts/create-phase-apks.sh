#!/usr/bin/env bash
# Builds the two Android apps of a two-phase device test (e2e/android/phases.mjs) as <out-dir>/before.apk and
# <out-dir>/after.apk. Both are the template app com.helloworld signed with the template's debug key, so the second
# installs over the first and keeps its data, as a store update does.
#
# Usage: .github/scripts/create-phase-apks.sh <upgrade|crash> <react-native-version> <out-dir>
#
#   upgrade  before: the published bridge UPGRADE_FROM (default 26.1.0) runs e2e/phases/upgrade-before.js.
#            after:  this repository's bridge runs e2e/phases/upgrade-after.js.
#   crash    before: a release build, so production JavaScript without developer support, runs
#                    e2e/phases/crash-before.js, which crashes the app.
#            after:  a debug build runs e2e/phases/crash-after.js.
# The "after" apps carry a development bundle, for the Countly.test helpers.
set -euo pipefail

kind=${1:?upgrade or crash}
version=${2:?react-native version}
out=${3:?output directory}
repo=$(pwd)
work=$(mktemp -d)
app="$work/app"
mkdir -p "$out"

# Runs a Gradle task of the app, once more a minute later when it fails, as downloads fail now and then.
gradle() {
  (cd "$app/android" && { ./gradlew "$1" --no-daemon -PreactNativeArchitectures=x86_64 \
    || { echo "::warning::$1 failed; trying once more in a minute"; sleep 60; ./gradlew "$1" --no-daemon -PreactNativeArchitectures=x86_64; }; })
}

# Makes e2e/phases/<entry> the app's entry, importing the bridge package the app installed.
use_entry() {
  mkdir -p "$app/e2e"
  cp "$repo"/e2e/phases/*.js "$app/e2e/"
  bridge=$(node -p "Object.keys(require('$app/package.json').dependencies).find((name) => name.startsWith('countly-sdk-react-native-bridge'))")
  BRIDGE="$bridge" perl -pi -e 's#(["'"'"'])countly-sdk-react-native-bridge(-np)?(?=["'"'"'/])#$1$ENV{BRIDGE}#g' "$app"/e2e/*.js
  printf 'import "./e2e/%s";\n' "$1" > "$app/index.js"
}

# Stores a development bundle of the entry in the app, which a debug build loads when no Metro server runs.
dev_bundle() {
  mkdir -p "$app/android/app/src/main/assets"
  (cd "$app" && npx react-native bundle --platform android --dev true --entry-file index.js \
    --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res)
}

case "$kind" in
  upgrade)
    name=$(node -p "require('./package.json').name")
    BRIDGE_PACKAGE="$name@${UPGRADE_FROM:-26.1.0}" .github/scripts/create-test-app.sh "$version" standard "$app"
    use_entry upgrade-before.js
    dev_bundle
    gradle assembleDebug
    cp "$app/android/app/build/outputs/apk/debug/app-debug.apk" "$out/before.apk"

    tarball="$work/$(npm pack . --pack-destination "$work" | tail -n 1)"
    (cd "$app" && npm install --no-audit --no-fund "$tarball")
    # The new package comes without the old one's generated code, which a Gradle clean would still look for.
    rm -rf "$app/android/app/build" "$app/android/app/.cxx" "$app/android/build"
    use_entry upgrade-after.js
    dev_bundle
    gradle assembleDebug
    cp "$app/android/app/build/outputs/apk/debug/app-debug.apk" "$out/after.apk"
    ;;
  crash)
    .github/scripts/create-test-app.sh "$version" standard "$app"
    use_entry crash-before.js
    gradle assembleRelease
    cp "$app/android/app/build/outputs/apk/release/app-release.apk" "$out/before.apk"

    use_entry crash-after.js
    dev_bundle
    gradle assembleDebug
    cp "$app/android/app/build/outputs/apk/debug/app-debug.apk" "$out/after.apk"
    ;;
  *)
    echo "unknown test $kind" >&2
    exit 2
    ;;
esac
echo "Built $out/before.apk and $out/after.apk for the $kind test"
