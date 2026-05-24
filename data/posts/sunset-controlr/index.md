---
title: 'Sunsetting ControlR'
date: 2026-03-28T14:22:16.218Z
cover: ./sunset-controlr-feature.png
caption: ' © Juan B. Rodriguez'
status: published
description: 'The end of the road. Stay foolish.'
pixelfed: ''
tags:
  - controlr
  - unraid
---

Effective June 1st 2026, ControlR will be removed from the App Store and Google Play; it will be no longer available for purchase.

## Brief History

`March 4th, 2016`

Almost 10 years ago, I started working on ControlR, as my Github commit history shows.

I launched it around June 6th 2016, available on Android only, since there was an iOS only app around already.

I built it mostly because I needed something that could handle the 2 Unraid servers I had at the time, the existing iOS app could only handle 1 server at a time.

Unraid forum members started asking for an iOS version. Lucky for them (and me), I'd built the whole thing in React Native — a cross-platform framework — so I already had it running on my own phone.

Around Sept 19th 2016, I published the app on the Apple store and that's when it started taking off.

Although it never generated enough income to live off of it, there were some big months, I remember one time Limetech mentioned the product and some other references/mentions that generated spikes in purchases.

## Rationale

### New Apps

The arrival of Unraid API created a simplified way to interface with servers and this ushered in a new crop of apps now available on the market.

Before the API existed, ControlR had to scrape web pages and read some text files (.ini) files to get data — a workaround that worked, but was never pretty.

### The Store Tax

Over the years, I've grown tired of the Apple/Google store politics & policies.

I've had my fair share of rejected app, had to go through appeals, had to request fast publish exceptions and more.

Revenue "sharing" is a thing and even if we can consider it steep at 15%, it was at an even steeper 30% for quite a long time.

Publishing on these platforms is not difficult, but maintaining an app becomes troublesome: they make changes to their apis, change permission requests procedures, implement new features and you're forced to adapt/comply otherwise your app is removed from sale.

As a solo developer juggling a full life, this gets more difficult as time goes by.

Publishing on the web is an entirely different experience. You build something, put it up, take payments, and nobody can pull the rug out from under you. No reviewer rejecting your binary. No policy change forcing a rewrite. No 30% toll booth on your own revenue.

No straitjacket holding you back.

### App-less Future ?

This is just me theorizing a probable scenario.

I think voice will be the primary user interface, with writing as a backup (or vice versa, depending on users preference or task at hand).

On the other side of voice, we'll have AI agents doing our bidding in the background.

We're already seeing what AI Agents like OpenClaw can do and it's barely getting started.

In that world, ControlR's job — giving you control over your servers without being physically in front of them — gets done by an agent that doesn't need a specialized UI. We're not there yet, but we're close enough that building toward it matters more than maintaining what's already built.

## Parting Notes

I have a deep appreciation for this product, it gave me purpose at a very special moment in my career.

Having it in my resume, definitely opened the doors for being considered and land jobs in the tech space.

I really hope it was useful and served a purpose to all the users that made a purchase over the years.

I also want to acknowledge and give thanks to the people that made this possible

- The Unraid community

  The Unraid Forums have always been a great place to be and the engagement from members of the forum is what drove a lot of the improvements and upgrades

  A special note to the moderators, that helped in different ways.

- The Unraid leadership

  I really appreciate the Unraid leadership for their support, allowing a commercial product to "live" on their forums, and the very graceful donation of a license for testing OS upgrades.

I'll still be around the forums, [unbalanced](https://github.com/jbrodriguez/unbalance) is not going away (still have some improvements I want to make)

