#!/usr/bin/env python3
"""Fail the build when the SDK caused a StrictMode violation that the allowlist does not accept."""

# Usage: strictmode_audit.py --allowlist .github/strictmode-allowlist.txt <strictmode.log>...
#
# The Android device test app turns StrictMode on (detectAll, penaltyLog) for the main thread and for the whole
# process, and e2e/android/run.mjs copies the logcat lines of tag StrictMode into a file: one "StrictMode policy
# violation" line with the violation class, then the stack. A violation belongs to the SDK when a frame of its stack
# is in ly.count.android.sdk (the Android SDK and the bridge). It is attributed to the first such frame, the one
# closest to the violation, as Class.method with anonymous class numbers dropped. Violations of React Native or of the
# test app are not the SDK's and are skipped.
#
# The allowlist has the format of the Android SDK repository's: "<policy> <violation> <Class.method or Class.*>",
# policy THREAD or VM, and "#" starts a comment. Exit status: 0 when every SDK violation is listed, 1 otherwise,
# 2 when a log file is missing.

import argparse
import collections
import os
import re
import sys

VIOLATION = re.compile(r"StrictMode policy violation[^:]*: (?:android\.os\.strictmode\.)?([A-Za-z]+Violation)")
SDK_FRAME = re.compile(r"\bat (ly\.count\.android\.sdk\.[\w$.]+)\.([\w$<>]+)\(")
ANONYMOUS_CLASS = re.compile(r"\$\d+")
THREAD_VIOLATIONS = {
    "DiskReadViolation", "DiskWriteViolation", "NetworkViolation", "CustomViolation", "ResourceMismatchViolation",
    "UnbufferedIoViolation", "ExplicitGcViolation",
}


def load_allowlist(path):
    """Parse the allowlist into (policy, violation, site) entries."""
    entries = []
    with open(path, encoding="utf-8") as handle:
        for number, raw in enumerate(handle, 1):
            line = raw.split("#", 1)[0].strip()
            if not line:
                continue
            parts = line.split()
            if len(parts) != 3 or parts[0] not in ("THREAD", "VM"):
                sys.exit("%s:%d: expected '<THREAD|VM> <violation> <Class.method or Class.*>'" % (path, number))
            entries.append(tuple(parts))
    return entries


def violations(path):
    """Yield (policy, violation, site, first lines) for each violation in a log file that an SDK frame caused."""
    with open(path, encoding="utf-8", errors="replace") as handle:
        lines = handle.read().splitlines()
    current = None
    for line in lines + ["StrictMode policy violation: END"]:
        match = VIOLATION.search(line) if "StrictMode policy violation" in line else None
        if match or line.endswith("END"):
            if current and current["site"]:
                violation = current["type"]
                policy = "THREAD" if violation in THREAD_VIOLATIONS else "VM"
                yield policy, violation, current["site"], current["lines"][:8]
            current = {"type": match.group(1), "site": None, "lines": [line]} if match else None
            continue
        if current is None:
            continue
        current["lines"].append(line)
        frame = SDK_FRAME.search(line)
        if frame and current["site"] is None:
            current["site"] = "%s.%s" % (ANONYMOUS_CLASS.sub("", frame.group(1).rsplit(".", 1)[-1]), frame.group(2))


def allowed(entries, policy, violation, site):
    """Whether an allowlist entry accepts the violation; "Class.*" accepts every method of the class."""
    for entry_policy, entry_violation, entry_site in entries:
        if entry_policy != policy or entry_violation != violation:
            continue
        if entry_site == site or (entry_site.endswith(".*") and site.startswith(entry_site[:-1])):
            return True
    return False


def main():
    """Read the logs, report every SDK violation, and fail on one the allowlist does not accept."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--allowlist", required=True)
    parser.add_argument("logs", nargs="+")
    args = parser.parse_args()
    entries = load_allowlist(args.allowlist)

    found = collections.OrderedDict()
    for path in args.logs:
        if not os.path.isfile(path):
            print("::error::%s is missing: the StrictMode lines were not recorded" % path)
            sys.exit(2)
        for policy, violation, site, sample in violations(path):
            key = (policy, violation, site)
            if key not in found:
                found[key] = {"count": 0, "sample": sample}
            found[key]["count"] += 1

    failed = False
    print("StrictMode violations the SDK caused:")
    for (policy, violation, site), info in found.items():
        accepted = allowed(entries, policy, violation, site)
        print("  %-6s %-28s %-55s %4dx %s" % (policy, violation, site, info["count"], "allowed" if accepted else "NOT ALLOWED"))
        if not accepted:
            failed = True
            print("::error::%s %s at %s is not in %s:\n%s" % (policy, violation, site, args.allowlist, "\n".join(info["sample"])))
    if not found:
        print("  none")
    if failed:
        sys.exit(1)
    print("Every StrictMode violation the SDK caused is in the allowlist.")


if __name__ == "__main__":
    main()
