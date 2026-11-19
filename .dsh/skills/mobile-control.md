---
name: mobile-control
description: "Use this when another Android device or app must be operated through its real UI: tap, type, scroll, open an app, or verify a screen."
---

# Operate another device's UI

Use this when the work cannot be done in this machine: an app on a connected phone, an emulator, or a physical device the user owns.

1. Confirm the link first: `pwsh` with `adb devices -l`. No device listed means stop and ask the user to connect it with debugging enabled. Do not invent a serial.
2. Observe before acting: `adb exec-out uiautomator dump /dev/tty` (or `adb shell uiautomator dump` then pull) to read the hierarchy. Take the resource id, text, and bounds of the target node — not a guessed coordinate.
3. Act on one target at a time: `adb shell input tap <x> <y>`, `text`, `swipe`, or `am start -n <package>/<activity>`. A tap is a coordinate from the dump you just read; re-dump after every action.
4. Verify each step with a fresh dump or a screenshot (`adb exec-out screencap -p > screen.png`, then `read_image`). A command that returns 0 has not proven the screen changed.
5. Never type a password, an OTP, or a private message through adb, and never read one from the screen. If the flow requires it, hand the device back to the user.
6. Stop on a system dialog you did not cause, on a payment screen, or on anything destructive (uninstall, factory reset, revoke) and ask.
7. Report: device, app and version, the steps taken, the final screen state, and what was not verified.

Upstream reference: CEditNeuro's `mobile-control`; the phone-only accessibility bridge is replaced by adb here.
