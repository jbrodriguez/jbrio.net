---
title: "Introducing ofxware"
author: "Juan B. Rodriguez"
date: 2010-04-04T23:23:23-00:00
description: "A C# proof of concept application to convert text data files coming from online banking sites into the ofx format, that can be imported by accounting software such as GnuCash. It's extensible by using a plugin architecture."
cover: ofxware-feature.png
tags: ["ofx", "gnucash", "csharp", "dotnet"]
---

## Rationale

At the beginning of the year, I opened an account with a different bank than the one I was using exclusively for the past few years.

Although some external factors were involved, there was also some financial gains with this transaction.

Anyhow, this new bank has a somewhat challenging understanding of ofx (Money) format, so the ofx files I downloaded weren’t readable by [GnuCash](https://www.gnucash.org/).

I initially thought about doing some manual manipulation, but quickly realized it wasn’t scalable.

And so … ofxware was born !

It took me a couple of iterations but finally I reached a stage where I could use it in a live environment, that is actually using it to support my finance management.

This is not a finished product yet, but it works for me.

Additionally, it’s open source on purpose … you can be the one to enhance the functionality, make it easier and more available to the general public.

## Product

ofxware is a very simple application thats converts text data files downloaded from online banking sites into ofx format files.

It’s a C# application, using the MVVM paradigm and it’s based on a plugin architecture, which means it is extensible in order to accept and process different formats of input files.

Additionally it’s open sourced under a GPLv3 license, so feel free to review the code and contribute with your own enhancements.

Download at [ofxware Google Code project](https://code.google.com/p/ofxware/).

## Update (MAR 15, 2015)

Due to the announcement of Google Code hosting project being closed, I've migrated the code to [`Github`](https://github.com/apertoire/ofxware).
