---
title: "Notes 202645"
date: 2026-11-14T11:30:00.000Z
cover: ./202645-feature.jpg
caption: "red sea platform © Juan B. Rodriguez"
alt: "A round viewing platform with a tensile canopy glows red under its own lights above a dark sea, with ships on the horizon and a band of sunset under heavy clouds."
status: published
description: "Context compression for month-long agent sessions and a 284B model running on a 64GB CPU, a fan revival of Underground 2, the personal knowledge graph macOS builds about you, a TUI Slack client in Go, and Expo's write-once native apps."
pixelfed: '1027192989508487415'
tags:
  - notes
  - ai
  - llm
  - agents
  - macos
  - games
  - tui
  - go
---

[ranxianglei/billion-context](https://github.com/ranxianglei/billion-context)
> A context-compression plugin for month-long single sessions (billions of tokens) ,small context windows (a 100K context is enough) and token savings (5x fewer tokens)

[Underground 2 Revived](https://nfsu2.xyz/)
> Fan project. Not affiliated with or endorsed by Electronic Arts.

[Anatomy of Apple's Personal Knowledge Graph](https://8rank.ai/game/apple-intelligence-personal-knowledge-graph)
> Every Mac since macOS 13 (allegedly) ships a pair of daemons whose only purpose in life is to build a graph about who you are, whom you know, how those people are related to you and to each other, how you communicate with them, where you go, what you do and when

[synchopate/llama-modchip:](https://github.com/synchopate/llama-modchip)
> 🐋 Run 284B DeepSeek-V4-Flash (<59GiB RAM, 44.4 tok/s pp, 9.1-14.7 tok/s) & 30B MoEs (25-111 tok/s) on a pure 64GB CPU at 256K ctx (0 GPUs). SwiGLU-H2, Stockfish-PVS L3 & 13ms Claude Code restore

[slk](https://getslk.sh/)
> slk is an open-source, daily-driver TUI Slack client built in Go. One static binary, no Electron, no node_modules. It cold-starts in milliseconds and keeps every workspace connected in parallel.

[expo/exact](https://github.com/expo/exact)
> Write an app once. It runs natively on the web, macOS, iOS, and Linux, and an AI agent can build it, run it, see it, and test it on every one of them.
