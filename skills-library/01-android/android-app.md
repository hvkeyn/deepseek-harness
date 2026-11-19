# Android app structure

Use this when the task is a new Android or Kotlin Multiplatform app, a feature in one, or its architecture, data, network, storage, Gradle, or tests.

1. Read the project before adding a library. Match the DI, the JSON parser, the image loader, and the network client already in the files. Do not add a second one.
2. Keep three layers. The screen draws state and sends events. The domain holds the rule and does not import Android UI. The data layer talks to the network and the database. The screen does not call Retrofit, Ktor, or Room.
3. The repository is the error boundary. It returns a result the domain already names. A network error is not thrown through the UI as a raw exception.
4. Local data is Room when it is rows, and DataStore when it is a few settings. A list that must work offline is stored, then shown. Do not invent a cache in a composable.
5. Network calls are suspend functions. Retrofit returns the body. Ktor maps the error in the repository. Do not start a coroutine with GlobalScope.
6. One-shot UI events are a channel the screen collects. Do not replay them from a state flow.
7. Hilt or Koin, whichever the project already uses. A new implementation stays internal behind the interface another module needs.
8. RxJava stays until the user asks to migrate that file. Then replace that file's types with suspend and Flow. Do not migrate the whole app in one edit.
9. One module until a second module has a real boundary. Widening a type to public needs a caller outside the module.
10. A behavior change gets a unit test the project already knows how to run. Run it with run_command. A failed test stays failed. A green test is not the screen.
11. A build uses the one Gradle task the project already has. If gradlew is in the project, run_command that. Otherwise load_tools group=build, install_jdk, then install_android_sdk, then run_command gradle. assembleDebug unless they asked for a release. Give the command several minutes. Success is the line BUILD SUCCESSFUL and an apk path you listed afterward. A compile that stopped is not a build. Quote the first error. Do not run that command again unchanged.
12. install_apk that apk. Do not install with the package manager from the shell, and do not uninstall first unless the user asked.
13. Then use_skill android-debug and check the behavior they named on the installed app. Do not say the feature works from the unit test alone.
14. For AGP 9, CameraX, Wear, TV, XR, Play billing, permissions, or this project's own R8 rules, http_request the matching raw file under https://github.com/android/skills and follow only the steps that page printed. If the page cannot be read, stop and ask the user to paste it. Do not install the Android CLI or a plugin.
15. Another app is opened only to check it: a build from a colleague, or an app the user is about to install. use_skill android-apk and follow it. A part of that code may be copied into a separate test app to reproduce one behavior. Its assets and branding are not reused, and the whole feature is not rebuilt.
