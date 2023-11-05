---
title: storage wars
author: Juan B. Rodriguez
date: 2012-05-06T23:23:23-00:00
description: "Plan to virtualize two instances of the unRaid NAS server, running as two virtual machines in a VMWare Esxi installation, as well as setting up a server with zfs as the filesystem."
cover: storage-feature.jpg
tags:
  - osx
  - unraid
  - zfs
  - esxi
  - das
---

i'm currently running an [unRaid](https://lime-technology.com) server, which hosts my media collection  (movies, tv series, music, pictures and data backups)

but, i'm running out of space on the server (currently 31.69TB used out of 32.51TB available)

so i started looking for options on how to expand my capacity and decided on adding a second unRaid server, virtualizing both unRaids in an ESXi 5 head server and putting the disks on two DAS boxes (discussions at [two unraid servers](https://lime-technology.com/forum/index.php?topic=14521.0), [atlas: a virtualized unraid](https://lime-technology.com/forum/index.php?topic=14695.0), [building a jbod das](https://www.servethehome.com/sas-expanders-diy-cheap-low-cost-jbod-enclosures-raid/)

at some point during that span of time, zfs came up. i researched as much as i could and finally found this enlightening thread: [Freenas vs unRaid](https://forum.xbmc.org/showthread.php?tid=82811&page=17).

my take on this whole storage wars is that each solution has its merits and my plan changed slightly

- continue with the virtualized + das boxes unraid setup
- add a virtualized zfs implementation to backup my osx data

the idea is that unRaid is much better suited to hold an expanding media collection, where i can add drives when needed and keep having one parity disk to protect the array. under zfs, every drive (or more precisely every vdev) would hit me with a parity space penalty

in my next posts, i will write down my zfs test scenario, while i wait for the parts of my all-encompassing ESXi build
