#!/usr/bin/env python3
"""Fail the build when the files that carry a version disagree."""

# Every version in this repository is written by hand, and nothing in a build notices a forgotten one: the app then
# reports one version to the server as sdk_version, npm and CocoaPods show another, and the changelog a third.
#
# The bridge version comes from package.json and must also be in package-lock.json (twice), CountlyReactNative.podspec,
# the Android and the iOS bridge version strings, and the first CHANGELOG.md heading. That heading is "## <version>", or
# "## <version>-np" in the no-push package, or "## XX.XX.XX" while the next release is not decided.
#
# The Android SDK version comes from android/build.gradle, and the newest "underlying Android SDK version" line of
# CHANGELOG.md must name it. The iOS SDK version comes from the copied iOS SDK (ios/src/CountlyCommon.m), and the two
# podspecs of the copy and the newest "underlying iOS SDK version" line of CHANGELOG.md must name it.

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
UNRELEASED = "XX.XX.XX"
ANDROID_BRIDGE = "android/src/main/java/ly/count/android/sdk/react/CountlyReactNativeImpl.java"
IOS_BRIDGE = "ios/src/CountlyReactNative.m"


def read(relative):
    """Returns the text of a repository file, failing the build when it is missing."""
    path = ROOT / relative
    if not path.is_file():
        sys.exit("::error::%s is missing" % relative)
    return path.read_text(encoding="utf-8")


def find(pattern, relative, what):
    """Returns the first group of `pattern` in a repository file, failing the build when it is absent."""
    match = re.search(pattern, read(relative), re.MULTILINE)
    if not match:
        sys.exit("::error file=%s::could not find the %s in %s" % (relative, what, relative))
    return match.group(1)


def main():
    """Collects every version, prints them, and exits non-zero when one disagrees with its source."""
    failures = []

    def expect(what, relative, actual, expected, source):
        """Records one version and whether it equals the version of its source."""
        mark = "ok" if actual == expected else "DIFFERS"
        print("  %-48s %-14s %s" % (what, actual, mark))
        if actual != expected:
            failures.append("::error file=%s::%s is %s, but %s says %s" % (relative, what, actual, source, expected))

    package = json.loads(read("package.json"))
    version = package["version"]
    print("Bridge version %s (package.json):" % version)
    lock = json.loads(read("package-lock.json"))
    expect("package-lock.json version", "package-lock.json", lock.get("version"), version, "package.json")
    expect('package-lock.json packages[""].version', "package-lock.json",
           lock.get("packages", {}).get("", {}).get("version"), version, "package.json")
    expect("CountlyReactNative.podspec s.version", "CountlyReactNative.podspec",
           find(r"^\s*s\.version\s*=\s*'([^']+)'", "CountlyReactNative.podspec", "version"), version, "package.json")
    expect("Android bridge COUNTLY_RN_SDK_VERSION_STRING", ANDROID_BRIDGE,
           find(r'COUNTLY_RN_SDK_VERSION_STRING\s*=\s*"([^"]+)"', ANDROID_BRIDGE, "bridge version"), version,
           "package.json")
    expect("iOS bridge kCountlyReactNativeSDKVersion", IOS_BRIDGE,
           find(r'kCountlyReactNativeSDKVersion\s*=\s*@"([^"]+)"', IOS_BRIDGE, "bridge version"), version,
           "package.json")
    heading = find(r"^## (\S+)\s*$", "CHANGELOG.md", "first version heading")
    if heading == UNRELEASED:
        print("  %-48s %-14s %s" % ("CHANGELOG.md first heading", heading, "not released yet"))
    else:
        expect("CHANGELOG.md first heading", "CHANGELOG.md", heading.removesuffix("-np"), version, "package.json")

    android = find(r"""['"]ly\.count\.android:sdk:([^'"]+)['"]""", "android/build.gradle", "Android SDK dependency")
    print("Android SDK %s (android/build.gradle):" % android)
    expect("CHANGELOG.md underlying Android SDK version", "CHANGELOG.md",
           find(r"^\* Updated the underlying Android SDK version to (\S+)\s*$", "CHANGELOG.md",
                "underlying Android SDK version line"), android, "android/build.gradle")

    ios = find(r'kCountlySDKVersion\s*=\s*@"([^"]+)"', "ios/src/CountlyCommon.m", "iOS SDK version")
    print("iOS SDK %s (ios/src/CountlyCommon.m):" % ios)
    for podspec in ("ios/src/Countly.podspec", "ios/src/Countly-PL.podspec"):
        expect("%s s.version" % podspec, podspec,
               find(r"^\s*s\.version\s*=\s*'([^']+)'", podspec, "version"), ios, "ios/src/CountlyCommon.m")
    expect("CHANGELOG.md underlying iOS SDK version", "CHANGELOG.md",
           find(r"^\* Updated the underlying iOS SDK version to (\S+)\s*$", "CHANGELOG.md",
                "underlying iOS SDK version line"), ios, "ios/src/CountlyCommon.m")

    if failures:
        print("\n".join(failures))
        sys.exit(1)
    print("\nEvery version agrees with its source.")


if __name__ == "__main__":
    main()
