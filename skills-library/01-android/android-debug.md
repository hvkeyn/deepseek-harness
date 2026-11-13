# Android debug on this phone

Use this when an app crashes, a feature of an app you built does the wrong thing, or a phone setting misbehaves.

1. load_tools group=device and load_tools group=debug. device_status shows battery, storage, memory, and whether root or Shizuku is on.
2. A feature check is the project in this folder, or the apk you just installed. use_skill systematic-debugging. debug_case action=open names that behavior in one sentence.
3. Read the activity from the manifest. shizuku_exec starts it with am start and that component. Do not guess the class. Then fetch_system_layout.
4. The check fails when the row you expected is missing or its label is not the one the task named. debug_case action=reproduce result=fail. Do not say it works.
5. One step only. execute_system_action uses the tap center the last dump printed for one row of this app. Then fetch_system_layout again. That second list is the result. Do not invent a coordinate. Do not tap a different app, the installer, or a system dialog. install_apk and uninstall_apk own install and remove.
6. Logs go through shizuku_exec: logcat -d -t 200 filtered to that package or its pid. Quote at most 20 lines. Do not run logcat in run_command. Leave out any line that looks like a token or a password.
7. If device_status says shizuku and root are both off, say the screen was not checked. Do not invent a tap or a log line.
8. The fix follows systematic-debugging. After the edit, run the same Gradle task, install_apk again, and repeat the same screen check. A unit test does not replace that check.
9. A crash, battery, or memory question still uses shizuku_exec for logcat -d -t 300 *:E, dumpsys battery, and dumpsys meminfo of that package. The Shizuku app does not need to be open.
10. open_settings takes the user to the right screen when the fix is a setting. The user changes it.
11. Write what the dump showed, what you did not run, and one next step.
