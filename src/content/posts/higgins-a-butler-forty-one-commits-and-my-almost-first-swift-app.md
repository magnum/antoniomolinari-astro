---
title: "Higgins: a butler, forty-one commits, and my (almost) first Swift app"
pubDatetime: 2026-08-13T01:35:00.000Z
description: I had forked it with the classic "I'll get to it over the weekend"
  intention. The weekend, as tradition demands, never came. Then an ordinary
  evening came instead, and in place of the weekend there was an AI with access
  to the project.
tags:
  - ai
  - swift
  - macos
draft: false
featured: false
crosspostedToSubstack: true
substackUrl: https://antoniomolinari.substack.com/p/higgins-a-butler-forty-one-commits
author: Antonio Molinari
---
There was a fork that had been staring at me for months.

[ButlerAI, by Giordano Scalzo](https://github.com/gscalzo/ButlerAI): a small macOS app that lives in the menubar, takes the text you've selected in any application, sends it to an AI, and pastes it back improved, right where it was. Select, hit a shortcut, the text comes back fixed. That's it. The original README has a line that says "Made with love by Cline and an amazed human", and I think it's the most honest description of this period I've read: an amazed human and an agent writing code together.

I had forked it with the classic "I'll get to it over the weekend" intention. The weekend, as tradition demands, never came. Then an ordinary evening came instead, and in place of the weekend there was an AI with access to the project.

## The name, first of all

Anyone who knows me knows I've been **Magnum** online (and offline) forever. So when the app started becoming mine, the name had been decided by forty years of television: Magnum's butler is called **Higgins**. There was really no other possible choice. The fork evolved into Higgins, and tonight it moved out: new repository, clean history, github.com/magnum/higgins.

## What changed along the way

The starting project worked. But getting my hands into things is how I understand them, and forty-one commits later Higgins does quite a bit more. Four changes in particular turned it from "an app I forked" into "my app".

**Multi-prompt management.** The original had one improvement prompt, take it or leave it. Higgins has a proper prompt library: named prompts you create, edit, and reorder in Settings, each one a small tool with its own job. "Fix grammar", "shorten", "translate to English", "make it polite enough for an Italian bank". One prompt is a feature; a library is a workflow. It changes how you use the app: it stops being a corrector and becomes a set of text operations you carry around the whole system.

**A contextual menu when the shortcut fires.** This is the change I use most. In the original, the hotkey applied the prompt, end of story. In Higgins, pressing ⌃⌥⌘C pops up a menu right at the cursor, in whatever app you're in, and you pick the prompt for that moment. Deciding at the point of use instead of in a settings panel sounds like a detail; in practice it's the difference between an app you configure and an app you talk to. Mail wants "polite", the commit message wants "shorten", the same shortcut serves both.

**Advanced {selection} handling.** Prompts are templates, and the selected text lands wherever you put the {selection} placeholder: beginning, middle, end, surrounded by whatever instructions and context you want. The app validates it too: a prompt without {selection} doesn't get saved, because a prompt that can't receive your text is just a note to self. It's a tiny contract between you and the model, and enforcing it at edit time means the hotkey never fires into the void.

**Refactoring, the invisible part.** This is where I had the most fun, and where the AI earned its keep. The two backends, OpenAI and local Ollama, now share a single AI transport with unified error mapping, instead of two clients each failing in its own dialect. Settings went through a proper service, UserDefaults plus Keychain, with migration of the legacy formats so old configurations survive. The OpenAI base URL got untangled from the Ollama one. The API key moved into the Keychain. The clipboard is snapshotted before and restored after, so the operation doesn't eat whatever you had copied. And the hotkey registers via Carbon without Accessibility permissions: the permission is requested only when it's actually needed, that is, when the app simulates ⌘C and ⌘V to read and replace the selection.

Around all this, the supporting cast: a searchable in-app log window, unit tests running with make test, and a GitHub Action that on a v* tag builds, signs, notarizes, and publishes the DMG. There's also an AGENTS.md in the repo: project notes written for agents, not humans. It's the document I keep most up to date, which says something about who does most of the work on this code.

## The part with the emotion

Here's the point: this is, with an honest margin, my first Swift app. I've built other people's projects, I've opened Xcode enough times to know where the button is, but I had never carried something of my own through this ecosystem. I'm a Ruby guy, a terminal guy, a server guy: SwiftUI, Carbon, the Keychain, pasteboard snapshots are another planet compared to my daily life.

And here comes back the argument I've been making for months with madcp, mcpme, aicli: AI isn't replacing me, it's waiving my entrance fee. Twenty years ago, entering a new ecosystem meant weeks of documentation before seeing anything work. Now the cycle is: idea, try, build, error, fix, build. In one evening. Competence still matters, maybe more than before, to know what to ask, what to accept, and what to throw away. But the distance between "I'd like to" and "it runs on my Mac" has shrunk to the point that abandoned forks have no excuses left.

**It's a very concrete form of freedom**. Not the kind from grand statements: the kind where you can say "I want this thing done this way" and do it, even outside your own technological fence, even in the evening, even for an app that I and maybe three other people will use. The pleasure of quickly building and testing an idea was what got me in front of a computer as a kid. It hadn't disappeared: it had just become expensive. Now it costs one evening.

Higgins is MIT, like Giordano's original, to whom the credit goes for the idea and the starting point. If you want a butler in your menubar: [github.com/magnum/higgins](https://github.com/magnum/higgins). And if you have a fork that's been staring at you for months, you know what to do.
