# Turn a page into an app

Use this when the user wants a website or an HTML file as an installable Android app.

1. Call load_tools group=device, then web_to_app.
2. Pass name and either url (http or https) or html (a project file, or a folder that contains index.html).
3. The tool writes an APK and returns its path and package id. Call install_apk with that path.
4. Ask the user to confirm the system installer. Do not open the new app and tap through it.
5. The same name and the same page update the installed app. A different name installs a second app.
6. Do not copy another installed app, change its package, or wrap a store app. Do not change TLS, hide the device, or add a proxy.
7. A local folder is stored inside the APK and works offline. A url opens live and needs a network.
