---
title: Five MPC integrations, one Sunday, and a switch that said no
pubDatetime: 2026-07-27T23:21:00.000Z
description: >
  The tools I use every day have excellent command-line interfaces. HEY has one.
  Basecamp has one. Google Workspace has `gws`. They're good CLIs — thoughtfully
  designed, well documented, the kind of thing you'd expect from people who
  care.


  And for months, none of that was any use to me where I actually work.
tags:
  - mcp
  - ai
draft: false
featured: false
crosspostedToSubstack: true
substackUrl: https://antoniomolinari.substack.com/p/five-integrations-one-sunday-and
author: Antonio Molinari
---
## *Or: what I learned about my own tools by building a single host for all of them*

The tools I use every day have excellent command-line interfaces. HEY has one. Basecamp has one. Google Workspace has `gws`. They're good CLIs — thoughtfully designed, well documented, the kind of thing you'd expect from people who care.

And for months, none of that was any use to me where I actually work.

Because a CLI runs on my machine, and the model I spend most of my day talking to runs somewhere else. Claude Code can shell out locally, sure. But I'm usually in the chat interface, or on my phone between meetings, and from there the gap is absolute. I'd built a workflow around it that I'm slightly embarrassed to describe: Claude writes a command, I paste it into Terminal, I paste the JSON back, Claude reads it, Claude writes the next command. Copy, paste, copy, paste.

That works for one lookup. It collapses instantly for anything real.

So one Sunday in July I sat down to fix it, and by midnight there was a thing called **MadCP**.

## The obvious wrong answer

My first instinct was to write an MCP wrapper around the HEY CLI. Small job. Fifty lines, four tools — `list`, `read`, `send`, `search` — register it, done.

Then I thought about Basecamp. Then Toggl. Then Fatture in Cloud, which isn't a CLI at all but a REST API I keep needing from chat.

And I realised what I was about to build: **five small servers, each with its own copy of the same hard parts.** Because the tool definitions are the easy bit. The hard bits are identical every time — HTTP transport, OAuth 2.1 with dynamic client registration so Claude can register itself without me shuttling tokens around, a login view, session handling, token refresh, credential storage, tool routing, error shape.

Writing that once is a real afternoon. Writing it five times, and then maintaining five slightly divergent copies of it forever, is how side projects die.

So the shape changed before I wrote any code. **One host, many integrations.**

## The shape

```text
madcp/
├── lib/madcp/            # the host: HTTP, OAuth, registry, DSL, logging
├── servers/<id>/         # one integration per folder
│   ├── server.rb         #   registers itself
│   └── README.md
├── views/                # operator UI
└── server.rb
```

The host owns discovery, OAuth for MCP clients, the JSON-RPC transport, the write gate, and the shared HTML endpoints. Each integration owns only its tools, its credential fields, and its calls out to a CLI or an API. Discovery is a glob: anything matching `servers/*/server.rb` gets registered. There is no integration code in `lib/` at all, and that's enforced by the fact that the host simply never looks there.

The folders are deliberately shaped like Git submodules that haven't been split out yet. Today they're plain directories, because a repo you can clone and run in one command is worth more than premature modularity. But the contract is already right, so the day one of them needs its own life:

```bash
git rm -r servers/hey
git submodule add <hey-server-repository> servers/hey
```

and nothing in the host changes. That's the kind of decision that costs nothing on Sunday and saves a weekend in eighteen months.

Five integrations went in: HEY and Basecamp wrapping 37signals' CLIs, Google Workspace wrapping `gws`, Fatture in Cloud on their v2 API, Toggl Track on v9. Roughly **130 tools**, about 7,000 lines including the UI. Thirty-eight commits between lunchtime and midnight.

## The switch that said no

Here's the part I actually want to write about.

Every tool in MadCP that mutates something is marked `write: true`. Those tools stay **disabled** until you opt in, per integration, with an environment variable. Read is free. Write requires a deliberate act.

I put that in early, felt vaguely good about myself, and moved on.

Two days later I was using MadCP in anger. I'd asked Claude to go into a company spreadsheet — our accounting workbook, the one with cash flow and partner drawings in it — and colour some rows red. It read the sheet, found the twenty-two matching rows, built the batch update, fired it, and got back:

```
ERROR: write method disabled. Set GOOGLEWORKSPACE_ALLOW_WRITE=true.
```

The gate held. Against me, on my own machine, on a file I own.

And that was the moment the design stopped being theoretical. Because what had just happened is that a language model, with valid credentials, had constructed and attempted a nineteen-request mutation against my company's financial records — and the thing that stood between intention and execution wasn't my attention. I'd already approved it. I was watching. It was the switch.

I then, of course, went and turned the switch on. Which is the honest ending, and it's worth sitting with: a gate you flip permanently is a gate that protects you exactly once. The version I'd defend is scoped and temporary — write enabled per integration, for the session that needs it, off again after. Mine is currently an env var on a box, and that's weaker than it should be. I'm writing that down here specifically so I do something about it.

Two smaller things from the same session, because they're the texture of actually running this stuff rather than demoing it:

**The Drive API lied to me.** Every call to the accounting file came back `File not found` — which is a spectacular error message for a file that exists and that I have edit rights on. The real cause was that it lives on a shared drive and the request needed `supportsAllDrives: true`. Not-found means not-visible-to-you, and those are very different sentences.

**A restart broke authentication.** Enabling the write flag meant restarting the container, which reloaded a stale access token from an environment variable — and that token shadowed the perfectly good refresh token sitting in credentials. The auth status endpoint cheerfully reported `token_valid: true`, because it was inspecting the cached token and not the injected one. Everything failed, including reads that had worked minutes earlier. **A status endpoint that checks the wrong thing is worse than no status endpoint**, because it spends your debugging time confidently.

## What it bought me

The payoff arrived on Tuesday, and it wasn't a demo.

I asked for an executive readout of July. What came back drew on five sources at once: hours per project and per person from Toggl, issued invoices with due dates from Fatture in Cloud, the cash-flow model and meeting minutes from Google Workspace, and every open assignment from Basecamp. Then it cross-referenced them.

That cross-referencing is the whole point, and it's the thing no individual tool could have done. The invoicing looked healthy — €26k issued in a month. The hours looked productive — 655 tracked. Separately, both fine. Put together against the payment terms, they said something neither could say alone: of €26k invoiced, €1,365 was collectable before September, and the cash gap lands on 15 August. One project had burned 30% of the month's capacity against €5,000 billed. And Basecamp supplied the sentence that actually stung, which is that all thirty-seven open assignments had the same name on them. Mine.

None of that is a clever question. It's just arithmetic across four systems that don't talk to each other. Which is precisely the work that never gets done, because doing it by hand means four logins, four exports, and an afternoon — and by the time you've got the numbers, you've lost the thread of what you were asking.

MadCP didn't make the analysis smart. It made it *cheap*, and depth is what you buy with cheapness.

## If you're going to build one

Some things I'd tell myself at lunchtime on Sunday:

**Decide host-versus-integration before you write a line.** Everything good about this project descends from that one call, and it would have been nearly impossible to retrofit after three servers.

**Build stdio locally first if you're new to MCP.** I went straight to remote HTTP because I wanted it on my phone, and spent real time debugging transport and tool logic simultaneously. The SDKs make promotion cheap. Debugging two unfamiliar layers at once is not.

**Treat authentication as the feature, not the chore.** An HTTPS endpoint that reads and sends your email, with no auth in front of it, is your mailbox donated to whoever port-scans that range first. OAuth 2.1 with PKCE and dynamic client registration is the reason this is allowed to exist.

**Separate read from write on day one.** Not because you don't trust the model — because you will, at some point, be tired, moving fast, and one confirmation away from a nineteen-request batch update against something you care about.

The code is at **[github.com/magnum/madcp](https://github.com/magnum/madcp)** — Ruby, Docker, MIT, five integrations, roughly 130 tools. There's a sibling project too, [mcpme](https://github.com/magnum/mcpme), which does the other half of the same problem: one tool, `run_shell`, for when what I need isn't an integration but the machine itself.

Between them, the gap I described at the top has closed. The CLIs I liked but couldn't reach are now just… there, in the conversation, on my phone, in a meeting.

**Long live computers. Long live tools that talk to each other.**
