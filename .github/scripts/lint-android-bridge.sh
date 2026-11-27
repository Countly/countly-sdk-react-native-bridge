#!/usr/bin/env bash
# Runs Android Lint on the bridge module of one source tree and writes the findings as SARIF.
#
# Usage: .github/scripts/lint-android-bridge.sh <source-tree> <sarif-directory> <app-directory>
#
# The bridge builds only inside an app, so this creates the React Native $REACT_NATIVE template app with the bridge
# packed from <source-tree> (this checkout, or the base branch for a comparison) and lints the bridge's module there,
# through android-lint.init.gradle, which also keeps lint from failing the build on its findings.
set -euo pipefail

source_tree=$(cd "${1:?source tree}" && pwd)
sarif=${2:?SARIF directory}
app=${3:?app directory}
scripts=$(cd "$(dirname "$0")" && pwd)

(cd "$source_tree" && "$scripts/create-test-app.sh" "${REACT_NATIVE:?}" standard "$app")
module=":$(node -p "require('$source_tree/package.json').name")"
mkdir -p "$sarif"

# Runs lint once more when it fails, as downloads from the Gradle plugin portal and Maven Central fail now and then.
lint() {
  (cd "$app/android" && ./gradlew --no-daemon --init-script "$scripts/android-lint.init.gradle" \
    "-DlintModules=$module" "-DlintDir=$sarif" "$module:lintRelease")
}
lint || { echo "::warning::Android Lint failed; trying once more"; lint; }
ls -l "$sarif"
