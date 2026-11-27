#!/usr/bin/env python3
"""Fail the build when the npm package would carry the wrong files or need a runtime dependency."""

# Usage: npm pack --dry-run --json > pack.json && python3 .github/scripts/check_package.py pack.json
#
# "files" in package.json decides what ships. A file the code needs but "files" leaves out still installs, and the app
# fails only when it bundles or builds; a file that should stay in the repository can leak a key or make every app that
# installs the package larger. The SDKs have no runtime dependencies, so the code may import only its peer dependencies
# and its own files.

import json
import posixpath
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Files the package must carry, besides "main" and "types" of package.json, with why each one matters.
REQUIRED = {
    "CountlyReactNative.podspec": "CocoaPods installs the iOS part of the bridge from it",
    "ios/src/CountlyReactNative.m": "the iOS bridge",
    "ios/src/PrivacyInfo.xcprivacy": "the privacy manifest App Store review requires",
    "android/build.gradle": "Gradle builds the Android part of the bridge from it",
    "android/src/main/AndroidManifest.xml": "the manifest of the Android library",
    "LICENSE": "the license the package is published under",
    "CHANGELOG.md": "the release notes integrators read before an upgrade",
}

# Paths the package must not carry, with why each one matters.
FORBIDDEN = [
    (re.compile(r"(^|/)(__tests__|CountlyTests)/"), "tests"),
    (re.compile(r"^(example|e2e|scripts|api)/"), "development files of this repository"),
    (re.compile(r"(^|/)\.[^/]+"), "a hidden file or folder"),
    (re.compile(r"(^|/)(node_modules|build)/"), "installed or built files"),
    (re.compile(r"\.(keystore|jks|p12|pem|key|mobileprovision|tgz|zip|log)$"), "a key, an archive or a log"),
]

MAX_FILE_BYTES = 300 * 1024
MAX_UNPACKED_BYTES = 3 * 1024 * 1024

# Relative imports and requires in the shipped JavaScript and TypeScript.
IMPORT = re.compile(r"""(?:\bfrom\s+|\bimport\s*\(\s*|\brequire\s*\(\s*|^\s*import\s+)["']([^"']+)["']""", re.M)
SOURCE = re.compile(r"\.(js|ts)$")
# Comments, so that documentation like "get this from 'getFeedbackWidgetData'" is not read as an import.
COMMENT = re.compile(r"/\*.*?\*/|(?<![:\"'\\])//[^\n]*", re.S)


def package_name(specifier):
    """Return the npm package a bare import names, for example "react-native" for "react-native/Libraries/x"."""
    parts = specifier.split("/")
    return "/".join(parts[:2]) if specifier.startswith("@") else parts[0]


def resolve(importer, specifier, shipped):
    """Return the shipped file a relative import of `importer` loads, or None when the package does not carry it."""
    base = posixpath.normpath(posixpath.join(posixpath.dirname(importer), specifier))
    for candidate in (base, base + ".js", base + ".ts", base + ".json", base + "/index.js"):
        if candidate in shipped:
            return candidate
    return None


def check_manifest(manifest):
    """Return the errors of package.json: any runtime dependency is one."""
    fields = ("dependencies", "optionalDependencies", "bundleDependencies", "bundledDependencies")
    return ["package.json has %s; the SDK must not need a runtime dependency" % field
            for field in fields if manifest.get(field)]


def check_required(manifest, files):
    """Return an error for each file the package must carry and does not."""
    required = dict(REQUIRED)
    for field in ("main", "types"):
        if manifest.get(field):
            required[manifest[field]] = 'the "%s" entry of package.json' % field
    return ["%s is missing from the package (%s)" % (path, reason)
            for path, reason in sorted(required.items()) if path not in files]


def check_files(pack, files):
    """Return an error for each forbidden or oversized file, and for an oversized package."""
    errors = []
    for path in sorted(files):
        reasons = [reason for pattern, reason in FORBIDDEN if pattern.search(path)]
        if reasons:
            errors.append("%s would be published (%s)" % (path, reasons[0]))
        if files[path] > MAX_FILE_BYTES:
            errors.append("%s has %d bytes, more than the %d a file may have" % (path, files[path], MAX_FILE_BYTES))
    if pack["unpackedSize"] > MAX_UNPACKED_BYTES:
        errors.append("the package has %d bytes unpacked, more than %d" % (pack["unpackedSize"], MAX_UNPACKED_BYTES))
    return errors


def check_imports(manifest, files):
    """Return an error for each import of a file the package does not carry, or of a package that is no peer."""
    allowed_packages = set(manifest.get("peerDependencies", {})) | {manifest["name"]}
    errors = []
    for path in sorted(p for p in files if SOURCE.search(p) and not p.endswith(".d.ts")):
        source = COMMENT.sub("", (ROOT / path).read_text(encoding="utf-8"))
        for specifier in IMPORT.findall(source):
            if specifier.startswith("."):
                if resolve(path, specifier, files) is None:
                    errors.append("%s imports %s, which the package does not carry" % (path, specifier))
            elif package_name(specifier) not in allowed_packages:
                errors.append("%s imports %s, which is not a peer dependency" % (path, specifier))
    return errors


def main(pack_json):
    """Read the `npm pack --dry-run --json` output and exit non-zero when the package is wrong."""
    pack = json.loads(Path(pack_json).read_text(encoding="utf-8"))[0]
    files = {entry["path"]: entry["size"] for entry in pack["files"]}
    manifest = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    print("%s %s: %d files, %d bytes packed, %d bytes unpacked"
          % (pack["name"], pack["version"], len(files), pack["size"], pack["unpackedSize"]))

    errors = (check_manifest(manifest) + check_required(manifest, files) + check_files(pack, files)
              + check_imports(manifest, files))
    if errors:
        for error in errors:
            print("::error::%s" % error)
        sys.exit(1)
    print("The package carries every required file and nothing from the deny list, its code imports only its own"
          " files and its peer dependencies, and it needs no runtime dependency.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: check_package.py <npm pack --dry-run --json output>")
    main(sys.argv[1])
