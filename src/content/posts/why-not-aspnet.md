---
title: Why not ASP.Net?
pubDatetime: 2007-08-29T16:12:51.000Z
description: >-
  Ultimamente, al lavoro e anche in forma "personale" mi sto guardando un po' in
  giro, un po' deluso imbolsito stanco dall'approccio che l'utilizzo del solo…
tags:
  - uncategorized
---

Ultimamente, al lavoro e anche in forma "personale" mi sto guardando un po' in giro, un po' deluso imbolsito stanco dall'approccio che l'utilizzo del solo [framework .NET](http://www.antoniomolinari.com/blog/wp-admin/Basically%20the%20biggest%20reasons%20have%20been:) obbliga ad avere, tra i "disguidi" posso citare:

- obbligo ad utilizzare spesso codice proprietario (framework e componenti/controli avanzati)
- perfetta integrazione con i sistemi windows, ma solo con quelli
- necessità di utilizzare ambienti di sviluppo mastodontic (Visual Studio, Sql Express et similia)
- non ultimo una preoccupante ombra Microsoft+Novell sullo sviluppo del Framework Mono, unico spiraglio per utilizzare .net non solo su piattaforme Win\*

Conscio che una maggiora apertura e un utilizzo di diversi strumenti non possa che giovare, tra le varie letture riporto quindi parti di un [interessantissimo articolo](http://www.lullabot.com/blog/why-not-asp-net) apparso su [Lullabot](http://www.lullabot.com/) :

> ASP.Net faces a couple of key disadvantages.
> 
> 1. **Cost.** A solid .NET development setup for a team of three or four, plus the licenses for all the server-side software you'll need to run things, can probably buy you half a man-year of developer time. This isn't a HUGE issue if you're launching a startup with funding, but quite a few of the groundbreaking sites out there started out as experimental skunk-works projects. You can cut costs by using free development tools (the C# compiler, after all, is a free download) but you lose a lot of the benefits that come with the platform.
> 2. **Fewer hackers.** This is very close to the first point, but it's a bit different. The barrier for entry for most of the 'hot' languages on the \*NIX side is low, closer to old-school ASP than the heavy-duty stuff of ASP.NET. That means a smaller pool of hobbyists-turned-coders to feed the project mill. While you probably don't mind the higher barrier for entry if you're hiring a team to develop some enterprise software, most startups don't happen that way. This isn't even a .Net specific issue -- it's more about the changing view of 'scripting languages' when compared to 'real languages' like C, Java, C#, C++, and... well. Whatever flavor of C you can think of.
> 3. **Not the best fit for web RAD.** .NET is an amazing platform for developing Windows applications. Truly awesome. Unfortunately, ASP.NET tends to err on the side of 'making the web work like WinForms'. When it comes time to web-enable your .NET based client/server application, you'll thank your lucky stars for ASP.NET's familiarity. When you're trying to pound out a prototype of a new social networking site, however, you'll feel like you're dragging a Volvo uphill. It just doesn't make as much sense.
> 4. **The people are the platform.** It's obviously not universal, but the GPL/MIT/Creative Commons influence that permeates the non-corporate \*NIX side of the development world affects a lot more than just the software itself. Rapid dissemination of best practices, novel tools, and open-sourced solutions to common problems are standard operating procedure in the \*NIX side of the fence. **Ultimately, this is far more important than the details of the specific software platform.** The Open Source world is a 'gift economy' -- you gain karma and status by giving people things of value. Whether that's a new caching API, patches for bugs in an existing framework, or hard-won knowledge about esoteric optimization issues, sharing is built into that development community's fabric. This makes life hell if you're trying to figure out how to sell boxed software, but if you're trying to implement a cool idea and launch a startup in your spare time, the difference is night and day.

... e in un commento al suddetto articolo, alcune condivisibili considerazioni sugli standard aperti:

> Basically the biggest reasons have been: a) Wanting freedom of choice and self determination instead of being beholden to vendors and meekly taking what they offer and getting lumped with their changing plans etc. We don't want to be stuck having to use an entire integrated stack - we want to be able to choose and swap individual layers of the stack in and out when necessary. Basically we got sick of vendors directly or indirectly affecting our destiny.
> 
> b) Agility and cost. Having to go back to vendors for more licenses every time you get a new developer or need a new server is a major PITA for a growing company. Managing licenses is an unwelcome distraction. Open source lets you install what you want when you want without extra costs and hassles.
> 
> c) Community. We have had far more success getting obscure bugs noticed and fixed on open source platforms than we had with the commercial ones. You can talk with open source developers directly. What little community exists around commercial platforms seems less open and more mercenary.
