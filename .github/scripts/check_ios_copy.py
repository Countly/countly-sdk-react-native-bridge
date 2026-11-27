#!/usr/bin/env python3
"""
Fails the build when the copy of the iOS SDK in ios/src is not the iOS SDK release it claims to be.

ios/src holds every file of an iOS SDK release except the iOS repository's own tooling (its hidden files and api/),
plus the files the bridge owns (BRIDGE_FILES). A hand edit to a copied file builds and ships, and the next copy of a
release deletes it without a trace; a file left out of the copy can break a build.

The release is the one ios/src/CountlyCommon.m names. The script fetches that tag of the iOS SDK repository into this
clone and compares git blob ids, so two files are equal only when their bytes, or for links their targets, are equal.
While the copy holds an iOS SDK version that has no tag yet, the check only warns; with STRICT=1, which release
branches set, it fails. IOS_REMOTE overrides the repository address, for example with a local clone.
"""

import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
IOS_REMOTE = os.environ.get("IOS_REMOTE", "https://github.com/Countly/countly-sdk-ios.git")
COPY = "ios/src"
BRIDGE_FILES = {
    "CountlyReactNative.h",
    "CountlyReactNative.m",
    "CountlyRNPushNotifications.h",
    "CountlyRNPushNotifications.m",
}
NOT_COPIED = re.compile(r"^(\.|api/)")


def git(*args):
    """Runs git in the repository and returns its output, or raises CalledProcessError."""
    return subprocess.run(["git", *args], cwd=ROOT, check=True, capture_output=True, text=True).stdout


def tree(ref, prefix=None):
    """Returns {path: (mode, blob id)} of every file under `prefix` in `ref`, with paths relative to `prefix`."""
    args = ["ls-tree", "-r", "-z", ref] + (["--", prefix] if prefix else [])
    files = {}
    for entry in git(*args).split("\0"):
        if entry:
            meta, path = entry.split("\t", 1)
            mode, _, blob = meta.split()
            files[path[len(prefix) + 1:] if prefix else path] = (mode, blob)
    return files


def main():
    """Compares ios/src with the iOS SDK release it names and exits non-zero on a difference."""
    common = (ROOT / COPY / "CountlyCommon.m").read_text(encoding="utf-8")
    match = re.search(r'kCountlySDKVersion\s*=\s*@"([^"]+)"', common)
    if not match:
        sys.exit("::error file=%s/CountlyCommon.m::could not find kCountlySDKVersion" % COPY)
    version = match.group(1)
    ref = "refs/countly-ios-copy/%s" % version
    try:
        git("fetch", "--quiet", "--depth=1", "--no-tags", IOS_REMOTE, "+refs/tags/%s:%s" % (version, ref))
    except subprocess.CalledProcessError as error:
        message = "the iOS SDK repository has no tag %s, so ios/src cannot be compared with a release (%s)" % (
            version, error.stderr.strip().splitlines()[-1] if error.stderr.strip() else "fetch failed")
        if os.environ.get("STRICT") == "1":
            sys.exit("::error::%s" % message)
        print("::warning::%s" % message)
        return

    release = {path: blob for path, blob in tree(ref).items() if not NOT_COPIED.search(path)}
    copy = tree("HEAD", COPY)
    errors = []
    for path in sorted(copy):
        if path in BRIDGE_FILES:
            continue
        if path not in release:
            errors.append("%s/%s is not part of the iOS SDK %s. If the bridge owns it, add it to BRIDGE_FILES in %s."
                          % (COPY, path, version, Path(__file__).relative_to(ROOT).as_posix()))
        elif copy[path] != release[path]:
            errors.append("%s/%s differs from the iOS SDK %s. Change the iOS SDK instead, and copy its release."
                          % (COPY, path, version))
    for path in sorted(release):
        if path not in copy:
            errors.append("%s/%s of the iOS SDK %s is missing from the copy." % (COPY, path, version))

    print("ios/src: %d files of the iOS SDK %s, %d files of the bridge."
          % (len(copy) - len(BRIDGE_FILES & set(copy)), version, len(BRIDGE_FILES & set(copy))))
    if errors:
        for error in errors:
            print("::error::%s" % error)
        sys.exit(1)
    print("Every copied file equals the iOS SDK %s release, and the copy misses none of its files." % version)


if __name__ == "__main__":
    main()
