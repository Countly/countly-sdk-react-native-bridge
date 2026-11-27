#!/usr/bin/env bash
# Writes the Android dependencies an app gets from the bridge, as Gradle resolves them, into a gradle.lockfile for a
# vulnerability scanner.
#
# Usage: .github/scripts/lock-android-dependencies.sh <app-directory> <gradle.lockfile>
#
# Creates the React Native $REACT_NATIVE template app with this checkout's bridge and resolves the release runtime
# classpath of the bridge's module: the Countly Android SDK, Firebase and what they pull in.
set -euo pipefail

app=${1:?app directory}
lockfile=${2:?lockfile path}
scripts=$(cd "$(dirname "$0")" && pwd)

"$scripts/create-test-app.sh" "${REACT_NATIVE:?}" standard "$app"
module=":$(node -p "require('./package.json').name")"
module_dir="$app/node_modules/$(node -p "require('./package.json').name")/android"

# Resolves once more when it fails, as downloads from the Gradle plugin portal and Maven Central fail now and then.
resolve() {
  (cd "$app/android" && ./gradlew --no-daemon --init-script "$scripts/dependency-lock.init.gradle" \
    "-DlockProject=$module" "$module:dependencies" --configuration releaseRuntimeClasspath --write-locks)
}
resolve || { echo "::warning::Resolving the dependencies failed; trying once more"; resolve; }

mkdir -p "$(dirname "$lockfile")"
cp "$module_dir/gradle.lockfile" "$lockfile"
cat "$lockfile"
