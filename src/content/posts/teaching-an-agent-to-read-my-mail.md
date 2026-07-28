---
title: Teaching an agent to read my mail
pubDatetime: 2026-07-25T15:00:00.000Z
description: The day my software got a feature request from its only user — and
  the user is an AI.
tags:
  - ai
  - mcp
draft: false
featured: false
crosspostedToSubstack: true
substackUrl: https://antoniomolinari.substack.com/p/teaching-an-agent-to-read-my-mail
author: Antonio Molinari
---

Halfway through an ordinary request — “summarize yesterday’s emails” — Claude did something I didn’t expect. It finished the summary, and then it appended a complaint. About my software.

“The limit is real: I can’t paginate backwards. The payload truncates after three messages, so yesterday might contain more that I simply can’t see. What I listed is what surfaced in the calls made so far, not a complete inventory of the day.” And then, the part that made me laugh out loud at one in the morning: “Give me half an hour of your time on the server, and I’ll write the patch myself.”

My tool has exactly one user. The user is not a person. The user just filed a feature request, correctly diagnosed the root cause, and offered to fix it. We’ll get back to this, because it’s the most interesting thing that happened all week. But first, the backstory.

## An email service with no API

I use HEY for email. HEY famously has no public API — it’s part of the philosophy, take it or leave it. But a while ago Basecamp quietly shipped hey-cli (github.com/basecamp/hey-cli): an official command-line client, OAuth against the real backend, JSON output, even a vendored “agent skill” explaining to LLMs how to use it. That’s not an API, but it’s close enough to be dangerous.

And there’s MCP — the protocol that lets Claude, Cursor, and friends call external tools. The syllogism writes itself: official CLI + thin wrapper + MCP = my email, my todos, my calendar, and my journal, available to any agent I talk to. No scraping, no reverse engineering, no violated terms. Just plumbing.

So the shopping list was: wrap every hey-cli command as an MCP tool, run it in Docker on the little server in my house, expose it through a Cloudflare tunnel, and add enough auth that “anyone on the internet can read my mail” stays a hypothetical.

## Prompt by prompt, again

If you read the sngr post, you know the methodology, and it hasn’t changed: one concern per turn, plain language, small diffs, me reloading and judging. What changed is the terrain. A song identifier is a happy path with a button on it. Infrastructure is an obstacle course, and every obstacle taught me something about where the decisions actually live.

The container couldn’t log in, because on macOS the CLI stores credentials in the system keyring and a headless Docker container has no keyring — solved with an env var, a named volume, and an entrypoint that fixes ownership before dropping privileges. Cloudflare answered “421 Invalid Host header”, because the MCP SDK ships DNS-rebinding protection that nobody tells you about until you put a proxy in front of it. And then the big one: Claude’s custom connectors don’t accept a plain bearer token. They want OAuth. Discovery endpoint, dynamic client registration, PKCE, a login form, the whole liturgy.

Past me would have budgeted a weekend for that and probably downgraded the feature to “later”. Instead I wrote, more or less: “Claude wants OAuth 2.1 with dynamic client registration. Build me the authorization server. Keep the static token working for curl.” It exists now. It has a login page. It rotates refresh tokens. I have opinions about that it works and taste about how the login page looks, and essentially no memory of typing any of it.

Somewhere in the middle I also said “rewrite the whole thing in Ruby, keep the behaviour identical” — for reasons that were half technical and half affection — and by the end of the evening there was a Ruby server, an end-to-end test of the entire OAuth dance, and one fewer Python project in the world. One sentence. That’s what a rewrite costs now, if you can describe what “identical behaviour” means and you’re willing to check.

## The user files a bug

Back to the complaint. Because Claude wasn’t wrong — it was precisely right, and I want to show you how the fix went, since it’s the cleanest example of the new loop I’ve seen yet.

We measured first. One posting in the raw CLI JSON weighs about 4.3 KB: avatar URLs, HTML signatures, sync endpoints — everything an email client needs and a language model doesn’t. My server caps tool output at 12,000 characters to protect the context window. Do the division: three emails per response. “Summarize yesterday” against a day with 81 emails was never going to work. The agent wasn’t hallucinating a limitation; it was describing my architecture better than my README did.

The fix was a projection: keep id, subject, sender, date, seen, a couple lines of summary — about 300 bytes per row. Twenty emails now cost less than what three used to. Then pagination by offset, which the CLI doesn’t have. Then search — text, date range, unread only — which the CLI also doesn’t have, done by over-fetching and filtering in the wrapper. Along the way we discovered that postings don’t even carry the thread ID you need to reply; it’s hiding inside a URL, and now the wrapper extracts it, which means “reply to that one” finally works straight from a list.

Notice the shape of the loop. An agent used the tool. The agent hit the wall and articulated the wall. Another agent (same family, different hat) measured the wall, proposed the projection, wrote it, and tested it against my real mailbox — 1,030 postings scanned in thirteen seconds, every filter verified against live data. My contribution was the part that doesn’t compress: deciding that compact should be the default and raw the option, that search should scan 500 recent messages unless you explicitly ask for the whole box, that a page which overflows should shrink by whole rows and tell the agent where to resume, rather than truncating mid-JSON like a barbarian.

The software improved because its user complained, and its user is software. I don’t have a tidy name for this yet. But I’ve seen the future of bug reports, and it writes better repro steps than most humans.

## Where my hands stayed on the wheel

Same disclaimer as always, because it matters more each time. The choice to build on the official CLI instead of anything darker: mine. Running it in-house, in Docker, behind a tunnel, instead of trusting someone’s cloud with my mail: mine. The kill switches, so an over-enthusiastic agent can list but not send unless I’ve allowed it: mine. The “paragraphs” design — after Claude sent an email as one glorious 900-character line and a friend asked if I was okay — mine. Compact by default: mine. MIT license: mine.

The typing — Python, then Ruby, then the OAuth provider, then the tests, then this very optimization — was not where the work was. It hasn’t been for a while.

## The moral, cheap as usual

Twenty years ago the job was writing the code. Ten years ago it was mostly gluing the right libraries. Now, increasingly, it’s this: hold the picture of what should exist, decide every fork in the road, and govern the activity of things that type much faster than you do — including, apparently, taking their feedback seriously when they turn out to be your users too.

Programming didn’t disappear. It moved. The focus is choosing, and the choosing doesn’t compress — I said the same thing about a font’s corners and about a Saturday-afternoon Shazam clone, and I’ll probably keep saying it until it stops being true. No sign of that yet.

The code is at **[github.com/magnum/hey-mcp](https://github.com/magnum/hey-mcp)**, MIT, sensitive corners filed off. If you use HEY and you talk to agents, it’s an evening of setup. If you don’t, steal the pattern instead: find the official CLI of a thing you love that “has no API”, wrap it in MCP, and let your favourite agent tell you what’s wrong with your wrapper.

It will. And it’ll be right.
