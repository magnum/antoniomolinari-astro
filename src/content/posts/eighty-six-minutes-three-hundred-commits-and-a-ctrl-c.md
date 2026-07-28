---
title: Eighty-six minutes, three hundred commits, and a Ctrl+C
pubDatetime: 2026-07-28T00:29:00.000Z
description: >
  I forget shell syntax constantly.

  Not the commands — the commands I know. It's the flags. It's `find` versus `fd`, it's which of the seven `tar` invocations is the one that actually extracts, it's the exact incantation for "every file over 100 MB modified in the last week, sorted by size". I've been doing this for twenty-odd years and I still open a browser tab for `rsync`.
tags:
  - others
draft: false
featured: false
crosspostedToSubstack: true
substackUrl: https://antoniomolinari.substack.com/p/eighty-six-minutes-three-hundred
author: Antonio Molinari
---

*Or: porting someone else's good idea into your own language, and discovering the flow was the product*

I forget shell syntax constantly.

Not the commands — the commands I know. It's the flags. It's `find` versus `fd`, it's which of the seven `tar` invocations is the one that actually extracts, it's the exact incantation for "every file over 100 MB modified in the last week, sorted by size". I've been doing this for twenty-odd years and I still open a browser tab for `rsync`.

There's a category of tool that fixes this, and I'd been using one for a while: **ai-shell**, from Builder.io. You type what you want in English, it hands you a shell command, you press enter and it runs. Small idea, well executed, and it lives in exactly the right place — the terminal, where you already are, rather than a chat window you have to tab into.

Two things bothered me about it. It was Node, and I write Ruby. And it was OpenAI-only, while most of my day is spent with Claude.

Neither of those is a good enough reason to fork a working tool. Together, at one in the morning, they apparently are.

## What it does

```bash
aicli list all log files
```

You get a suggested command, and then a choice: run it, revise it with another prompt, edit it by hand, copy it, or cancel. There's a short alias, `ai`, because a tool you invoke thirty times a day should be two characters.

There's also a chat mode:

```bash
aicli chat
```

which is the same thing but conversational — you can say "no, only the ones from this month", and it adjusts.

It speaks sixteen languages, detects your OS so it doesn't hand you GNU flags on a BSD userland, and reads your shell history for context. That's not my work. That's three hundred commits of somebody else's careful thinking, inherited wholesale.

## The port

The repository has 306 commits. **293 of them aren't mine.** They run from April 2023 to January 2026 and they're the actual product: the prompt engineering, the streaming output, the OS detection, the sixteen locale files, the regex patterns that strip a model's enthusiastic prose down to a single executable line.

My contribution is thirteen commits, between 00:47 and 02:13 on a Tuesday morning. Eighty-six minutes.

```
00:47  Refactor project to Ruby: removed Node.js files, added gemspec, CLI
00:48  Replace JSON translation files with YAML
00:49  Rebranding, authorship, LICENSE
00:50  Version 1.0.12 → 0.1.0
01:00  aicli gemspec and CLI implementation, replacing ai-shell
01:17  0.2.0 — Anthropic provider, all LLM calls through RubyLLM
01:46  0.2.2 — better `ai update`
01:53  0.2.3 — multi-turn chat that runs commands and keeps going
01:55  0.2.4 — persist the last 40 messages; migrate config
02:10  0.2.6 — Ctrl+C clears the line instead of exiting
02:13  Gemspec and README polish
```

I want to be precise about what happened there, because "ported a project in an hour and a half" is the kind of sentence that's technically true and deeply misleading.

What took eighty-six minutes was the *translation*. TypeScript to Ruby, `package.json` to gemspec, JSON locales to YAML, a Node CLI to a gem with `bin/aicli` and `bin/ai`. That's about 1,500 lines of Ruby, and it's the part where an agent is genuinely, unambiguously good — the structure already existed, the decisions were already made, and the work is mechanical transposition with a hundred small idiomatic judgements along the way.

What did *not* take eighty-six minutes is everything the port stands on. Somebody spent three years figuring out that you need to strip code fences, that streaming should be interruptible, that a Chinese-speaking developer wants the explanation in Chinese but the command in POSIX. **You cannot compress that. You can only inherit it**, which is what open source is for, and why the MIT header at the top of my LICENSE still carries Builder.io's copyright above mine.

Version numbering tells the same story, if you look: the project was at 1.0.12 and I reset it to 0.1.0. Not modesty — accuracy. The Ruby thing is new and hasn't earned a 1.

## The part that was actually mine

Once it ran, the interesting work started, and it wasn't architectural. It was flow.

**Anthropic support, via RubyLLM** (0.2.0). Rather than write a second API client, I routed everything through [RubyLLM](https://rubyllm.com/), which gives provider-agnostic streaming and a model registry for free. Defaults are `gpt-4o-mini` on OpenAI and `claude-sonnet-4-6` on Anthropic; you switch with one config line. The next provider is now somebody else's problem, which is the correct amount of my problem.

**Chat that doesn't end when the command runs** (0.2.3). Originally, chat mode suggested a command and that was the end of the exchange. Now, when the assistant proposes something in a code fence, you're asked whether to run it — and afterwards, whether you ran it or not, the conversation *continues*. This sounds trivial. It changes what the tool is for. "Find the big files" → run → "now delete the ones older than a year" is a single thought, and it used to require three separate invocations.

**Memory across invocations** (0.2.4). The last forty messages persist in `~/.aicli/context` and reload next time. Your terminal now remembers what you were doing yesterday.

And then two fixes that I think are the most instructive things in the whole changelog:

**The `y/n` prompt was reading from the wrong place** (0.2.5). When output is being streamed and piped around, `stdin` isn't necessarily the human. The fix is to read the confirmation from `/dev/tty` explicitly — the actual terminal, not whatever got wired into standard input. Before that, a stray newline in the stream could answer the "run this command?" question for you. That is not a cosmetic bug. That's a tool executing something you didn't approve, and the fix is four characters of path.

**Ctrl+C now clears the line instead of quitting** (0.2.6). I typed half a prompt, realised it was wrong, hit Ctrl+C out of thirty years of muscle memory, and the whole session died. Every time. So now Ctrl+C clears the current input, and Ctrl+d exits, which is what every other REPL on the machine does.

Neither of those is clever. Both took minutes. And they're the difference between a thing you demo once and a thing you actually reach for, which is the entire lesson of the evening: **the port was the easy part, and the flow was the product.**

## Still a beginning

There's a lot missing, and I know roughly what it is.

Right now aicli knows about your OS and your shell history, but nothing about the directory you're standing in — no sense of "this is a Rails app" or "there's a docker-compose here", which is exactly the context that makes a suggestion good instead of generic. It has no notion of danger, either: `ls` and `rm -rf` get the same polite confirmation prompt, and they should not. And it can't yet reach anything beyond the shell, which is a strange gap given that [half my tooling now speaks MCP](https://github.com/magnum/madcp).

Those are the obvious three. There are others I haven't thought of yet, which I'll discover the way I discovered the Ctrl+C thing — by being annoyed by it at one in the morning.

The gem is on RubyGems:

```sh
gem install aicli
```

Source at **[github.com/magnum/aicli](https://github.com/magnum/aicli)**, MIT, Ruby 3.0+, and standing on the shoulders of [ai-shell](https://github.com/BuilderIO/ai-shell), which did the hard part first.

It's rough. It's version 0.2. But it's a beginning — and it's already the thing I type when I can't remember the `tar` flags.

**Long live computers. Long live standing on other people's work, and saying so.**
