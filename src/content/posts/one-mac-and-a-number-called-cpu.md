---
title: One Mac, and a number called %CPU
pubDatetime: 2026-07-27T21:02
description: For about a week my MacBook Pro had been feeling tired. Not broken
  — tired. The kind of tired where a click on a file in an open panel lands half
  a beat late, where the pointer refuses to turn into a hand over a link, where
  a window drag stutters once and then behaves for ten minutes so you start to
  wonder whether you imagined it.
tags:
  - macos
  - mcp
  - claude
  - debugging
  - ruby
draft: false
featured: false
crosspostedToSubstack: true
substackUrl: https://antoniomolinari.substack.com/p/one-mac-and-a-number-called-cpu
author: Antonio Molinari
---
For about a week my MacBook Pro had been feeling *tired*. Not broken — tired. The
kind of tired where a click on a file in an open panel lands half a beat late, where
the pointer refuses to turn into a hand over a link, where a window drag stutters
once and then behaves for ten minutes so you start to wonder whether you imagined it.

The machine is an M5 Max with 128 GB of RAM. It is not allowed to feel tired.

The usual advice is to reboot. I know the usual advice. I also know that "turn it off
and on again" is where diagnosis goes to die, and that if a machine degrades to
unusable in six days, rebooting weekly is a workaround for a bug I haven't found yet.
So I decided to actually find it — and to do it with Claude sitting next to me,
looking at the real system instead of guessing from a description.

That second part required building something first.

## mcpme

I wanted a model to be able to run commands on my machine. Not to *suggest* commands
for me to copy-paste, one at a time, pasting output back — that loop is slow enough
that you stop asking the third question, which is usually the one that matters. I
wanted it to look, decide what to look at next, and look again.

So I wrote **[mcpme](https://github.com/magnum/mcpme)**: a small Ruby MCP server whose
entire job is to expose one tool, `run_shell`, that executes a command on the host and
returns stdout plus the exit status.

The interesting part isn't the tool, it's the access control around it:

- **Streamable HTTP** MCP endpoint, OAuth 2.1 with Authorization Code + PKCE S256
- Dynamic Client Registration, Protected Resource Metadata, Authorization Server Metadata
- Credentials from `.env`, no anonymous access — unauthenticated requests get a flat `401`
- Exposed through a **Cloudflare tunnel** to `https://127.0.0.1:8765`, so **no port is
  forwarded on my router** and my home IP exposes nothing

That last point is the one I'd insist on if you build something similar. Handing a
language model a shell is a reasonable thing to do on a machine you own. Handing the
open internet a shell is not. The tunnel plus OAuth means the blast radius is "someone
who has my credentials", not "someone who ran masscan".

It is roughly 400 lines of Ruby. It took an afternoon.

## What we actually did

The session ran long. Here's the shape of it, including the parts where I was wrong,
because those turned out to be the useful parts.

**First look.** `WindowServer` pinned at 102% CPU — one fully saturated core, since its
render loop is single-threaded. Load average 5.5 with 72% idle. System time at 17%
against 7% user, a ratio of nearly 3:1. That ratio is the tell: the machine wasn't
computing, it was passing messages to itself.

**First suspect: BambuStudio.** The log showed it cycling its embedded WebKit XPC
services three times a second, 900 of 1049 RunningBoard state updates in five minutes.
Also 126 `timed out fence` errors per two minutes in CoreAnimation — consecutive frame
IDs, 17 ms apart, which is one dropped frame after another at 60 Hz for over a second.
That's the stutter, found and named.

I closed it. The fence timeouts went to zero. **WindowServer didn't move.** I had
found the freezes but not the load.

**Second suspect: Time Machine.** `SystemUIServer` — a process that in modern macOS is
nearly vestigial — was opening and invalidating **846 XPC connections per minute**,
interleaved with `DMErr=-69810` failures from DiskManagement. The cause: my Time
Machine destination is a sparsebundle on an SMB share, DiskArbitration can't resolve
its BSD name, and the Time Machine menu bar extra was polling it fourteen times a
second and failing every time.

That one was real. But even after it was fixed, WindowServer sat at 93%.

**The measurement was lying.** This is the moment the whole thing turned. On macOS,
`ps %cpu` is a decaying lifetime average. For a process that has been running six days,
it is close to meaningless. Once I started measuring properly — sampling
`ps -o time=` twice and dividing the delta by the wall clock interval — the picture
changed completely.

What emerged was a cluster. Ten to thirteen unrelated processes, all sitting between
11% and 15%: SystemUIServer, TextInputMenuAgent, Siri, Raycast, Butler, Telegram,
Notion, OrbStack, Google Drive, PostgresMenuHelper, Figma. Different vendors, different
frameworks, nothing in common.

Except one thing. **Every single one of them owns an icon in the menu bar.**

## The finding

`TextInputMenuAgent` is the agent that draws the input-source menu. I have exactly one
keyboard layout configured. It had four threads, emitted one log line per minute, and
had consumed **6.5 hours of CPU in six days**. It was spinning, doing nothing, silently.

I killed it. It respawned. The new process settled at **0.0%**.

Same binary. Same job. Same machine. The difference was uptime.

I repeated it:

| Process | Before | After restart |
|---|---:|---:|
| SystemUIServer | 15.3% | **0.0%** |
| TextInputMenuAgent | 12.7% | **0.0%** |
| Siri | 13.1% | **0.0%** |

There is no single guilty application. Long-lived GUI agents that own a menu bar status
item degrade into a busy loop over days of uptime, and restarting the individual
process resets it. Everything else — the saturated WindowServer, the delayed clicks,
the cursor that stops turning into a hand — is downstream of the aggregate.

By the end, without rebooting:

```
WindowServer   96.4%  ->  55%
CPU system     17.4%  ->  11.5%
Load average    5.80  ->   5.15
```

Along the way we also collected the supporting evidence: 245 windows owned by
WindowServer itself with only 3 on screen, 104 of them full-screen buffers never
released — including 39 at the resolution of the built-in display, which has been
closed in clamshell the entire time. `Cursor disabled: failed set_cursor_surface` in
the log, thirty times in twenty minutes, which is exactly why the pointer stopped
changing over links. And 84 instances of `SetStoreUpdateService` from
`CascadeSets.framework`, all spawned at boot, never reaped, because its Info.plist
declares `ServiceType = Application` — one instance per client app, forever.

That's roughly 1.8 GB sitting in orphaned XPC services on a system that had 1.1 GB free.

## The one I got wrong

I want this in the post because leaving it out would make the process look cleaner
than it was.

I found 191 stale `NSStatusItem` registrations in `com.apple.controlcenter`, numbered
`Item-0` through `Item-197`, against 8 with real names. It was a beautiful hypothesis:
the menu bar layout engine iterating 199 entries on every redraw, every status-item
owner participating, everyone paying. It explained the numbers perfectly.

I backed up the plists, pruned all 191, restarted ControlCenter, and measured.

Nothing. WindowServer went *up*, and the cluster didn't budge. Dead hypothesis, twenty
minutes gone, menu bar icons reshuffled for my trouble.

There was a similar moment earlier when `mdls` on a directory took 2.4 seconds and I
briefly thought I had Spotlight. Ran it three more times: 47 ms, 51 ms, 45 ms. Cold
cache. Also nothing.

## What the model was actually good at

Not knowledge. I could have looked up every one of these subsystems.

What it was good at was **not getting bored**. A system-level investigation is dozens
of measurements, most of which lead nowhere, and the failure mode for a human at
11 p.m. is to stop at the first plausible story. Having something that will
enumerate 1,565 processes, cross-reference launch daemons against code signatures,
count XPC connections in a 60-second log window, and then say *"that didn't work,
let's measure something else"* — thirty times in a row, without ego about the
hypothesis it proposed four steps ago — is a genuinely different way to work.

The other thing worth saying: it was willing to invalidate its own tooling. Halfway
through, it noticed that `timeout` doesn't exist on macOS and that several earlier
measurements had therefore been garbage, and said so unprompted. In a debugging
session, a collaborator who retracts their own bad data is worth more than one who is
right the first time.

I kept the loop honest by insisting on numbers before and after every change. That's
not a model-specific discipline, it's just debugging — but a shell tool makes it
cheap enough that you actually do it.

## What I'm left with

A small script, `spin-check`, now in my dotfiles. It samples CPU time deltas across
the usual suspects, tells me which agents have degraded, and with `--fix` restarts
them. It doesn't solve anything — the bug is in macOS 27.0 beta and only Apple can
fix that — but it means I can recover a sluggish desktop in twenty seconds instead of
rebooting and losing my session.

A Feedback Assistant report with real before/after measurements and a sysdiagnose
taken while the problem was live, which is worth considerably more than "my Mac is slow".

And mcpme, which started as a way to avoid copy-pasting terminal output and turned
into the most useful thing I've built this month.

**Repo: [github.com/magnum/mcpme](https://github.com/magnum/mcpme)**

---

*If you build your own: OAuth on the endpoint, tunnel instead of port forwarding, and
run it as your user rather than root. A model with a shell is a power tool. Power tools
get respect, not fear — but they do get respect.*
