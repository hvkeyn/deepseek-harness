# Video download

Use this when the user wants a film, a movie, a clip, a stream, or a video page saved into the project. A note about a video is video-notes; this skill saves the file.

1. load_tools group=video. A direct .mp4, .webm, .m3u8, or .mpd address is download_video with that url. A page is the same call with the page url. Do not save a media page with http_request.
2. quality is best unless the user named a height. 1080, 720, 480, and 360 pick that ceiling. audio saves the sound only. worst is a small sample. folder defaults to downloads. name overrides the title.
3. The phone reads a direct MP4, an HLS stream including AES-128, and a page yt-dlp knows. A TS stream is remuxed to MP4 on the phone. A page that needs the extractor may install Python and yt-dlp once in this app. Do not install ffmpeg. When a site offers only separate picture and sound tracks, the tool refuses and says so; do not invent a merge.
4. A DRM-protected, paid, or login-only video is refused. Do not look for a bypass, a mirror, a converter, or another site. Do not log in for the user.
5. When a browser extension, a share sheet, or a vidbee://download link sends an address, the first message already names it. Call download_video on that address, then report the saved path, the byte size, the format, and the seconds.
6. A film takes minutes. Do not cancel it, do not start a second download, and do not repeat the same call. The status shade shows the percent while it runs. The file opens in a video tab and the reel editor can cut it.
7. When the task is done, use_skill name=video-download scope=app on=false.
