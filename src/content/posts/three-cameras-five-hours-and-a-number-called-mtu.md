---
title: 'Eight cameras, five hours, and a number called MTU'
pubDatetime: 2026-05-17T17:33:20.000Z
description: >-
  I came home one evening and my Netatmo indoor cameras were offline. All of
  them (except one). Same moment. The kind of synchronised failure that
  immediately…
tags:
  - homeassistant
  - homelab
  - iot
  - newtork
crosspostedToSubstack: true
substackUrl: 'https://antoniomolinari.substack.com/p/eight-cameras-five-hours-and-a-number'
---

## _Or: twenty bytes you forgot existed, quietly ruining your evening_

I came home one evening and my Netatmo indoor cameras were offline. All of them (except one). Same moment. The kind of synchronised failure that immediately makes you suspect the network rather than the devices.

Some context: my Netatmo setup is not small. Over the years I've ended up with two indoor cameras, four outdoor cameras, two video doorbells, and a siren — **all of them stubbornly 2.4 GHz only**. Over the last couple of years I've had recurring connection issues with one or another of them, the kind of low-grade flakiness you get used to and stop noticing. Restart a thing here, re-pair a thing there, move on. But now it looked like nothing was working anymore. And honestly? That tipped me from "annoyed" into the good kind of obsessed. This was a challenge I wanted to take on.

I run a reasonably overbuilt home network — TP-Link Omada SDN, an ER7206 gateway, a managed switch, five EAP access points scattered across the house, multiple SSIDs, the whole adult-with-too-much-time setup. The cameras had been on this network for months. Then, one day, not anymore.

My first instinct was the same as anyone's: open the app, hit "reconnect", get on with my evening. The app didn't oblige. The setup wizard stalled at "Setting up the accessory…". I tried iOS, then Android. I rebooted the cameras. I factory-reset one of them by ejecting the microSD card — yes, that's how you reset a Netatmo Welcome, which is the kind of detail that sticks with you. Still nothing.

Then I noticed something. Of all my Netatmo devices, exactly one was still streaming video correctly. I checked the network logs: it was the only one connected to the Starlink router's own access point, not to my Omada Wi-Fi. Every other device, scattered across my five EAPs, was either offline or stuck in that limbo state where the cloud thought they were online but the live view refused to load.

That was the moment the problem stopped feeling like "Netatmo is broken" and started feeling like "my network is doing something specific to these devices". _Great. So it's my network._

And here's where the adventure properly began.

## The rabbit hole

I spent the next hours with Claude (Anthropic's AI assistant) as a **sparring partner**, walking through every layer of the network. We checked the obvious things first: WPA mode, PMF settings, channel width, fast roaming, band steering. We disabled multicast-to-unicast conversion, ARP-to-unicast, the lot. We hunted through the Omada Controller's UI looking for any feature with "smart" in the name and turned it off. The cameras were associating to the access points just fine — Omada showed them as connected clients — but the app still said "video unavailable".

We considered VLANs (none configured). ACLs (none either). We even reset the cameras a second time. Same result.

Then came the hypothesis that broke me: **maybe the gateway was the problem**. Maybe I needed to remove the Omada router entirely and let Starlink handle everything.

I sat with that one for a while. The Omada gateway is the brain of my network. Pulling it out means renumbering everything, reconfiguring DHCP, possibly losing the controller's ability to manage the access points. It's a forty-minute job that breaks every smart device in the house until it stabilises.

I had another tab open. Amazon. Reolink cameras. Hub-free, ONVIF, RTSP, no cloud nonsense, ~€60 each. _Maybe it's time._

I closed the tab.

## The point

Here's the thing about working with an AI on a problem like this: **it's an extraordinary lab partner**. It pattern-matches across thousands of similar cases, suggests hypotheses faster than you can type, and never gets tired. But it also never gets _attached_ to the problem. It doesn't care if you spend three hours debugging or thirty minutes replacing the hardware. The judgement of when to stop, when to escalate, when _not_ to follow the suggested path — that part is still mine. And rightly so.

So I didn't pull out the router. I said: let's keep looking.

## A number called MTU

We narrowed it down by elimination. The cameras worked on the Starlink Wi-Fi (`192.168.1.x`). They didn't work on the Omada network (`192.168.0.x`) — neither over Wi-Fi nor over Ethernet. They were connecting and uploading event timelines to the Netatmo cloud, but the live video stream was failing. Something specific to long-lived TLS connections was breaking.

That's the signature of an MTU problem.

MTU stands for **Maximum Transmission Unit** — the largest packet size that can travel across a network without being fragmented. Ethernet's default is 1500 bytes. But when your traffic crosses a satellite link, a CGNAT layer, and a couple of NATs, the _real_ end-to-end MTU can be lower. If your router doesn't know that, large packets get silently dropped. Small requests succeed. Video streams die.

I opened a terminal:

```
ping -D -s 1472 8.8.8.8   # tests MTU 1500 — failed
ping -D -s 1452 8.8.8.8   # tests MTU 1480 — succeeded
ping -D -s 1454 8.8.8.8   # tests MTU 1482 — failed
```

The real path MTU was exactly **1480**. Not 1500. Twenty bytes of overhead somewhere in Starlink's satellite-and-CGNAT pipeline that nothing in my network was accounting for.  
I changed the MTU on the ER7206 from 1500 to 1480. Saved. Waited a minute.  
All the cameras came back online. The stream worked. Faces appeared.

## What I'm taking away

Five hours. Two reset cycles. Most of an evening. The fix was a single integer in a single field on a router admin page.

A few things I want to remember from this:

The cameras had actually been flaky for a long time on 2.4 GHz — I'd just learned to live with it, blame the cheap antennas, restart things occasionally. The root cause was probably always there, slowly worsening as Starlink's network configuration evolved. The "sudden" failure wasn't sudden. It was patience running out.

AI made this debugging session vastly faster than it would have been alone. I'd have spent two days reading forums to get to the same place. But the AI also confidently proposed solutions that, if I'd executed without thinking, would have left me with a half-dismantled network and the original problem intact. **The driver's seat stays mine**.

And finally: I almost spent €180 on new cameras to avoid spending another hour understanding the problem. **Time spent understanding _is_ time invested**. **Faster isn't always better**. **Long live computers**. **Long live wanting to know how things work**.

If you got this far and you're staring at a network full of devices that mostly-work-but-sometimes-don't: try `ping -D -s 1472 8.8.8.8`. You might be surprised.
