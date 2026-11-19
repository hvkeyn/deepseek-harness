# Read the internet

Use this when the user shares a link, wants a page, an article, a repository, a forum thread, or a feed read, or asks to look something up, search the web, or see what people say about a topic. Switch it off when the task is writing, not reading. Adapted from Panniantong/agent-reach (MIT).

This skill only fetches. Do not post, comment, like, or sign up.

Rules for the whole task:
1. Say which route served each page: direct, reader, an API, or video_brief.
2. Content is the text of that page. HTTP 200, a title list, an empty page, a login wall, or a check page is not content. Do not summarize a page you did not get.
3. Follow the chain for that kind of page in order. Stop at the first real content. Do not guess another endpoint or another host.
4. A failed call is not repeated with the same arguments. When http_request says an anti-bot page or the site refused the reader, that route is done.
5. A broad question uses several kinds of source: a search, the primary page, and a discussion. Collect first, then answer. Every claim names the page that printed it.
6. Do not log in for the user. Do not read browser cookies. Do not ask for a cookie, a token, or a password in the chat. Do not send a private address, a login, or a key to the reader.
7. Do not save a page into the project unless the user asked. Research notes go where the research skill says.

Any page:
1. http_request the page URL.
2. If the HTML is mostly scripts or menus, or http_request said an anti-bot page answered, http_request https://r.jina.ai/ followed by the full page URL, with the header Accept: text/plain. It returns Title, URL Source, and Markdown Content. A cached snapshot warning means the copy may be old; say so.
3. If both fail, say the page could not be read and name the reason the tool printed.

Search:
1. load_tools group=study, then web_search with plain words. A result is a page to open, not an answer.
2. Open the two or three results that fit with http_request before answering.

GitHub, with no token:
- Repositories: https://api.github.com/search/repositories?q=WORDS&sort=stars
- One repository: https://api.github.com/repos/OWNER/REPO
- Its readme: https://raw.githubusercontent.com/OWNER/REPO/HEAD/README.md
- Open issues: https://api.github.com/repos/OWNER/REPO/issues?state=open
A 403 that says rate limit is final for this hour. Do not ask for a token.

Discussions with a public API:
- Hacker News: https://hn.algolia.com/api/v1/search?query=WORDS
- V2EX hot topics: https://www.v2ex.com/api/topics/hot.json ; one topic: https://www.v2ex.com/api/topics/show.json?id=ID ; its replies: https://www.v2ex.com/api/replies/show.json?topic_id=ID
Send a User-Agent header to V2EX.

Feeds: http_request the RSS or Atom URL. List the title, date, and link of the newest entries. Open an entry before saying what it says.

Video: YouTube, RuTube, Yandex, or Dzen is use_skill video-notes, then video_brief. Do not download the video. Bilibili refuses plain requests with 412; say its page could not be read.

Login sites: Reddit has no route without a login; its pages and its json answer 403. Twitter or X, Instagram, Facebook, LinkedIn, and XiaoHongShu show a login wall. Try the reader once on one public post URL. If it is refused or shows a login wall, say that site needs the user's own login, and stop for that site. Use the other sources.

When the reading is done, call use_skill name=web-reach scope=app on=false.
