---
title: Sngr an afternoon in product mode
pubDatetime: 2026-05-23T21:28:41.000Z
description: >-
  I had an idea on a Saturday morning. A small one — the kind that would
  normally sit in a notes app for six months and then quietly die. I wanted a…
tags:
  - uncategorized
draft: true
---

## Or: what it feels like to ship a Shazam clone without writing the code yourself

I had an idea on a Saturday morning. A small one — the kind that would normally sit in a notes app for six months and then quietly die. I wanted a browser-based song identifier. Tap a button, hold your phone near a speaker, get the track title, the artist, and a link to Spotify. No App Store, no native build, no signing certificates. Just a URL.

I called it [sngr](https://sngr.m6i.it). By dinnertime it was live.

Now, "ship a thing in an afternoon" is the sort of sentence that gets thrown around a lot lately, usually by people selling a course. So let me be precise about what actually happened, because the interesting part isn't the speed. It's the _posture_.

## The shopping list

I started from a stock Vue + Vite scaffold and a clear product picture in my head. I wanted: a single screen, one big record button, a live waveform behind it so you knew the mic was actually listening, three obvious states (ready, listening, recognising), a history of past matches saved locally in the browser, and a proper "Listen on Spotify" call to action in Spotify green. I wanted it to feel like an app, not like a side project.

The recognition itself I outsourced to [AudD](https://audd.io/), which does the heavy audio-fingerprinting lifting and — nice touch — can return a Spotify link directly if you ask for `return=spotify`. One API key, no OAuth dance, no second integration.

That was the brief. Then I opened Cursor and started talking.

## Prompt by prompt

What I did, for about three hours, was give one instruction at a time. Not a giant spec, not a "build me a Shazam clone with these forty-seven features". One concern per turn, in plain language.

"Describe what this app does in the README." "Make the main button embossed, with a subtle 5% scale on hover." "When the user taps record, the button turns green and pulses; when we're sending the audio off, it turns yellow and shows a musical note icon." "The history button on the left and the cancel button on the right should never push the main button off centre — even when one of them is hidden." "Add a `?test` query parameter that bypasses the API and feeds in a mock AudD response, so I'm not burning credits while I tweak the UI."

The agent read the codebase, matched the patterns it already saw, and shipped small diffs. I reloaded the browser, looked at the result, and either approved it or said "no, the cancel button should sit at the same vertical level as the history button, mirrored". Then the next prompt.

That's it. That's the whole methodology.

## The weird new feeling

Here's the bit I want to talk about, because it's the part that genuinely surprised me.

For the entire afternoon, I never opened a `.vue` file. I never wrote a line of CSS. I didn't import Heroicons by hand, I didn't wire up the `MediaRecorder` API, I didn't write the abort controller for the cancel button, I didn't fiddle with Tailwind v4's new config. All of that happened — it had to, the app works — but it happened on the other side of the conversation.

What I did instead was stay in **product mode**. The whole time. I was thinking about what the app should _feel_ like. Where the button should sit on a small screen. Whether failed recognitions should be saved to history (no — you don't want a list of "couldn't identify this" entries cluttering up the view). Whether the history icon should be visible-but-disabled or hidden entirely when there are no entries yet (hidden, because if it's there but greyed out, it shifts the main button off centre, and the centring matters more than the affordance).

These are the decisions that make an app feel _made_ rather than generated. And for the first time, I got to make all of them without context-switching into "okay but how do I do that in Vue, exactly" every five minutes.

It's a strange sensation. Coming from twenty-plus years of writing code, there's a part of you that mistrusts it. You feel like you're cheating, or like you've outsourced your craft, or like surely the result must be worse because you didn't suffer for it. I had to consciously override that feeling a few times. The result wasn't worse. The result was a small, polished, working app that did exactly the thing I'd pictured.

## Where my hands stayed on the wheel

I want to be careful here, because in [a previous post](https://m6i.it/three-cameras-five-hours-and-a-number-called-mtu/) I made a fuss about the importance of not letting the AI drive blind, and I stand by that. So let me say where my hands actually stayed on the wheel for sngr.

The shape of the product was mine. The choice of stack was mine. The decision to use AudD specifically — and to lean on its `return=spotify` feature instead of integrating the Spotify API separately — was mine, made after reading their docs for ten minutes. The judgement calls about UX (the centred button, the hidden-not-disabled history icon, the portrait lock on mobile, the test mode) were all mine. The agent suggested approaches; I picked.

What I delegated was the _plumbing_. The imports, the file structure, the boilerplate, the "I know what this should look like but I don't want to spend forty minutes remembering the exact Tailwind v4 syntax" tax. That tax, multiplied across a project, is what normally turns "an afternoon" into "a long weekend". Removing it doesn't make me a worse engineer. It makes me a faster product designer who happens to know what's possible.

## Hours, not days

Without an agent, this scope was a two-to-four day job. Not because the code is hard — it isn't — but because of the death-by-a-thousand-paper-cuts of building anything with care. Reading the AudD docs. Wiring the `MediaRecorder`. Drawing the waveform on a canvas. Fixing the layout bug where the results push the button down. Building the localStorage history. Making it not break on mobile in landscape. Each of those is twenty minutes of focus, and there are dozens of them.

The afternoon collapse isn't magic. It's just that when each of those twenty-minute chores becomes a two-minute conversation, the whole project compresses by an order of magnitude. And the part that _doesn't_ compress — the product thinking, the taste, the judgement about what makes the app good — gets the rest of the day.

That's the leverage. Not "AI writes the code while you sleep". Just: the thinking parts get more of your attention, because the typing parts get less of it.

## Try it

You can play with sngr at [sngr.m6i.it](https://sngr.m6i.it). If you want to see the full UI flow without using an AudD credit, add `?test` to the URL and it'll feed in a mock response. The source is on GitHub: [github.com/magnum/sngr](https://github.com/magnum/sngr).

If you've got a small tool idea sitting in your notes app — the kind you keep telling yourself you'll build "when you have a weekend" — try this instead. Open a chat with an agent tonight. Give it one instruction at a time. Stay in product mode. See how far you get before bed.

You might be surprised which side of the conversation does the typing, and which side does the deciding. The deciding is the part that's still yours, and it always will be. The rest, increasingly, isn't where the work is anymore.
