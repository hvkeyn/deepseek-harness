# Notes from a video

Use this when the user sends a YouTube, RuTube, Yandex, or Dzen video and wants the point of it, the important ideas, or whether it is worth watching. Switch it off when the task is not a video.

1. Call load_tools group=study, then video_brief with the page URL. Do not download the video. Do not open a stream, an m3u8, an mp4, or a googlevideo host. Do not call http_request on those.
2. Use only the title, the description, and the captions the tool printed. Do not invent a scene, a quote, a speaker's face, or a number. If captions is no, say the picture was not seen and judge only the description.
3. Write in the user's language, in this order. Смысл: one short paragraph of what the video is actually about. Важные мысли: 3 to 7 points, each tied to a caption sentence or the description. Skip a point the text does not support. Вывод: what a viewer should take away. Стоит ли смотреть: yes, only a part, or no. Name what is interesting and what is filler, a repeat, or an advertisement. If the text is thin, say there is not enough to judge the picture.
4. A number in the note goes through calculate. Do not store a cookie or a token from the page.
5. When the note is written, call use_skill name=video-notes scope=app on=false.

Find path. A topic is video_brief action=search. A channel is action=channel. A playlist is action=playlist. Up to 3 pages are action=batch urls separated by |. Those list lines are titles only. Open a video before judging its meaning. Do not sign up for a transcript service and do not store an API key for one. Captions are cut, so a long video is the start of the public captions, not a viewing of the picture.
