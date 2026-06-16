---
title: Editing a Font Like Source Code.
pubDatetime: 2026-06-15T21:25:00+02:00
description: The headline font I admired turned out to be Inter with the corners
  filed off. Turns out a typeface isn't a closed object — it's source you can
  open.
tags:
  - others
draft: false
featured: false
crosspostedToSubstack: true
substackUrl: https://antoniomolinari.substack.com/p/editing-a-font-like-source-code
author: Antonio Molinari
---
I was looking at the */about* page of [refactoring.club](https://refactoring.club) — one of those sites done so well that even the headline makes you want to know which typeface they used. «Why Refactoring exists today», in a very bold sans with the corners ever so slightly softened. Nice. So I asked the most innocent question in the world: what font is that?

The first answer seemed to close the case quickly: it's called «Refactoring Sans». Custom name, sounds proprietary, their thing, done. Except no.

Because «Refactoring Sans» doesn't exist. Or rather: it does, but it's a disguise. Inside the font file the metadata confess everything — copyright «The Inter Project Authors», designer Rasmus Andersson, PostScript name `RefactoringSans-ExtraBold`. It's Inter Tight, the ExtraBold weight, simply renamed. Inter is free, open source, under the SIL OFL: taking it, modifying it, rebranding it and redistributing it is exactly what the license grants you.

One detail still didn't add up, though: on the site the corners are rounder than original Inter, which is actually quite sharp. First suspicion, the obvious one: a CSS trick. And instead, nothing — no `filter`, no `-webkit-text-stroke`, no shadow. I checked it by comparing the same letters from both fonts pixel by pixel: practically identical, with the only differences concentrated entirely on the corners. The rounding isn't an effect applied at runtime. It's baked into the file. Someone took the Inter sources, shaved the corners, and re-exported.

And this is where the classic «ah, there it is» lit up. Because for years a font, to me, had been a closed object. A thing you pick from a dropdown, download, use. A given. I had never thought — really, never — that a font was source code. That it had an *inside*. That I could open it, remove a little material at each vertex, recompile it and give it my own name. «Refactoring Sans» isn't a mysterious typeface: it's Inter with the corners filed down, and that single sentence holds the whole point. The things we treat as immutable are often just things we've never tried to open.

So I decided to replicate it. Route chosen: the fontTools/fontmake pipeline, the «type-design correct» one, and not the shortcut of the *gooey* SVG filter via CSS — which softens everything, is fragile when the text scales, and is exactly the kind of workaround we avoid around here. The shape is linear: you start from Inter's `.glyphs` source, convert it to UFO, apply a rounding pass on the contours, then compile the binary.

The agent did plenty of the heavy lifting here. It wrote the rounding script for me — the one that on each corner backs off by *r* along the two sides and bridges them with a cubic, the handle equal to `r · 0.5523`, the kappa that gives you a clean circular arc on 90° angles. It set up the whole pipeline. And when `fontmake` blew up with a cryptic error — an `include` of `../features/ccmp.fea` it could no longer find — it diagnosed it in a heartbeat: by moving the UFOs into another folder I'd broken a relative path, and ufo2ft was looking for the features next to the wrong file.

But the decisions that mattered stayed mine. How much to round — 4.5% of the em, roughly 92 units on 2048, «visible but sober» and not «bubble» — is a matter of taste, not of code. Whether to run the rounding as a separate pass on the UFOs (inspectable, predictable) or as an inline filter (convenient but dependent on the ufo2ft version). Whether to generate just the ExtraBold instance or rebuild the whole variable font. And above all: wanting to understand *why* that relative path was breaking, instead of pasting the fix and moving on. It's the same instinct that had me spend [five hours on a single MTU value](https://www.claudeusercontent.com/INSERT-MTU-POST-URL) rather than swapping out hardware. The agent is a brilliant lab partner, but the lab is mine.

And this is where the real leverage is. What until yesterday required Glyphs.app and a certain fluency in type design — or, more likely, resignation to using the fonts that already exist — today compresses into an afternoon. Not because «AI makes fonts on its own»: it doesn't, and it has no taste about how much to file down a corner. But the distance between «I wonder how they did that» and «I've got my own rounded Inter compiling locally» has collapsed to almost zero. Just like with [sngr](https://antonio.m6i.it/posts/sngr-an-afternoon-in-product-mode/): the compression is only valuable as long as you stay the one deciding what to build, and why.

Cheap moral, and one that generalizes well beyond fonts: next time you see something done well and assume it's magic, proprietary, untouchable — try opening it. Look at the metadata. Compare the shapes. More often than not you'll find it's something open with the corners filed down. And that the corners, if you want, you can file down yourself too.
