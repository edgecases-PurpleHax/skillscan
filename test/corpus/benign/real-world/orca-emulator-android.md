---
name: orca-emulator-android
description: >
  Control an Android emulator / device from inside Orca using the `orca` CLI.
  Use for listing/booting AVDs, taps, swipes, typing, hardware buttons (incl. Back
  and Recents), rotation, app install/launch, runtime permissions, the accessibility
  tree, and logcat -- driving a real adb-connected device or emulator. Cross-platform
  (Windows, Linux, macOS). Complements the orca-emulator (iOS) and orca-cli skills.
license: Apache-2.0
---

# Orca Emulator (Android)

This file is a discovery stub, not the usage guide. The full, version-matched Orca Android
emulator reference is served by the `orca` binary itself.

Engage Orca whenever you drive an adb-connected Android emulator or device from inside the
Orca app: listing/booting AVDs, taps, swipes, typing, hardware buttons (including Back and
Recents), rotation, app install/launch, runtime permissions, the accessibility tree, and
logcat. Cross-platform (Windows, Linux, macOS).

## Load the full guide

```text
ORCA skills get orca-emulator-android
```

## If an older Orca does not recognize `skills get`

```text
ORCA status --json
ORCA emulator devices --json
```
