# Second monitor

Use this when the user wants this phone as an extra monitor for a Windows or Linux computer they own.

This is an extended display. Windows uses the virtual display already on that computer and the adb link that is already open. Linux uses Sway or Hyprland. GNOME, KDE, and a plain session cannot, and the script says so. A copy of the main screen is not this task. Same Wi-Fi is not a shell. Do not download a display program. Do not ask for a password in the chat.

1. Windows, when this phone is connected by adb: the picture is at http://127.0.0.1:8791/ through that adb tunnel. second_monitor action=open with that address. If the page does not open, the tunnel is not up. Do not invent an address. Do not use SSH for this.
2. Linux: load_tools group=remote and remote_connect to the computer the user already put in Settings. Do not invent a host or a password. second_monitor action=script os=linux. remote_write that text unchanged. ssh_exec runs nohup python3 -u that file, with output redirected to second-monitor.log, then a trailing ampersand. remote_read the state path the log prints. If the log says the desktop cannot add a virtual monitor, stop and say so. Do not claim a display was added. second_monitor action=open with the address it printed.
3. To stop Linux, ssh_exec the same file with the argument stop. Do not change, repack, or sell a display program. Do not print the address in the chat. Do not upload a picture of the computer. When the extra display is up, use_skill name=second-monitor scope=app on=false.
