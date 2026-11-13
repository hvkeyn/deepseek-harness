# Compose on this phone

Use this when the task is Jetpack Compose, a screen, Navigation 3, an XML layout migration, or edge-to-edge.

1. State is hoisted. A composable receives state and events. remember holds UI-only state. derivedStateOf is for a value that is expensive to recompute.
2. A lazy list uses a stable key. Do not apply the list inset as padding on the parent. Pass it as contentPadding so rows can scroll under the system bars.
3. A new Activity calls enableEdgeToEdge before setContent. The manifest uses adjustResize for a screen with a text field. Scaffold padding is applied once. Do not add ime padding when the scaffold content insets already include the keyboard.
4. A full-screen dialog sets decorFitsSystemWindows to false. Touch targets are at least 48dp. System back leaves the screen.
5. Navigation stays on the library the project already uses. A new app uses Navigation 3: a typed route, NavDisplay, and one back stack per top-level tab. Do not invent a route string if the project is already type-safe.
6. An XML layout is migrated one screen at a time. The old view stays until that screen's Compose replacement builds.
7. Before changing navigation, edge-to-edge, or an XML migration, http_request the matching file: https://raw.githubusercontent.com/android/skills/main/navigation/navigation-3/SKILL.md or https://raw.githubusercontent.com/android/skills/main/system/edge-to-edge/SKILL.md or https://raw.githubusercontent.com/android/skills/main/jetpack-compose/migration/migrate-xml-views-to-jetpack-compose/SKILL.md. Follow only a step that page printed. If the page cannot be read, stop and ask the user to paste it.
8. The project's theme wins. Do not copy a company's screen.
