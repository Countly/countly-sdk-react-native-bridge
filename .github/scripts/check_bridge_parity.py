#!/usr/bin/env python3
"""Checks that the iOS bridge exports exactly what it implements.

The Swift class holds the implementations and the Objective-C file tells React Native which of
them to export. A name or an argument that appears in one and not the other is a call that never
arrives, with no compiler error and no runtime message, so it is checked here instead.
"""

import re
import sys
from pathlib import Path

SWIFT = Path("ios/src/CountlyReactNative.swift")
OBJC = Path("ios/src/CountlyReactNative.m")


def swift_selectors(source: str) -> set:
    """Returns every selector the Swift class exposes to the Objective-C runtime.

    :param source: contents of the Swift bridge
    :return: the selectors, including the class name annotation
    """
    return set(re.findall(r"@objc\(([^)]+)\)", source))


def exported_selectors(source: str) -> list:
    """Returns every selector the Objective-C file declares to React Native.

    :param source: contents of the Objective-C export list
    :return: the selectors, in the order they are declared
    """
    selectors = []
    for match in re.finditer(r"(_?RCT_EXTERN_(?:REMAP_)?METHOD)\((.*?)\)\s*$", source, re.M):
        body = match.group(2)
        if match.group(1).endswith("REMAP_METHOD"):
            body = body.split(",", 1)[1].rsplit(",", 1)[0]
        labels = re.findall(r"(\w+)\s*:", body)
        selectors.append("".join(label + ":" for label in labels) if labels else body.strip())
    return selectors


def main() -> int:
    """Compares the two files and reports what does not line up.

    :return: 0 when every export has an implementation, 1 otherwise
    """
    if not SWIFT.exists() or not OBJC.exists():
        print(f"missing {SWIFT} or {OBJC}, run this from the repository root")
        return 1

    implemented = swift_selectors(SWIFT.read_text())
    exported = exported_selectors(OBJC.read_text())

    missing = [selector for selector in exported if selector not in implemented]
    duplicates = [selector for selector in set(exported) if exported.count(selector) > 1]

    print(f"exported: {len(exported)}, implemented: {len(implemented) - 1}")

    if missing:
        print("exported with no implementation:")
        for selector in missing:
            print(f"  {selector}")
    if duplicates:
        print("exported more than once:")
        for selector in duplicates:
            print(f"  {selector}")

    return 1 if missing or duplicates else 0


if __name__ == "__main__":
    sys.exit(main())
