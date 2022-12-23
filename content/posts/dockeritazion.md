---
title: Dockerization
author: Juan B. Rodriguez
date: 2014-01-09T23:23:23-00:00
cover: /img/docker.jpg
description: "How to virtualize a home server environment, by means of a lightweight tool such as Docker, rather than much heavier alternatives such as VMWare Esxi, KVM or Xen."
tags:
  - docker
  - unraid
  - virtualization
  - esxi
  - go
---

## Background

so, [back in 2012](/storage-wars/) i posted about virtualizing my media storage and general backup infrastructure.

today i will post about going back to bare metal ... well, sort of :)

just a couple of days ago, [my setup](https://lime-technology.com/forum/index.php?topic=21514.0) was running and working mostly fine

the biggest nuisance was that since i didn't leave the unraid boxes running 24x7, each time i wanted to turn them on, i had to start the unraid vms, then turn the das boxes and finally start the array manually. kind of tedious.

fast forward to 2013, esxi 5.5 is out and you start to hear that vsphere client will be crippled as far as new esxi versions are concerned.

some discussions started showing up in the unraid forums, about virtualizing unraid under xen or kvm.

the time was ripe for an overhaul of my infrastructure, get rid of esxi and move on to either xen or kvm. or so i thought.

## Research

although a lot of topics were being discussed in the unraid forums, something that got to me, was the fact that actually i should be running unraid as close to the hardware as possible, which meant de-virtualizing my esxi vms.

at about the same time, a new player entered the scene, which i'd heard about before, but never really understood

enter [Docker](https://www.docker.io/).

it made a huge difference to think in terms of containerized lightweight applications rather than full blown vms.

i wouldn't even need xen nor kvm, if i could get the apps i ran on my vms to run as docker containers.

that's what i set out to do, and that's what i achieved.

this is the story of what i did

## Step by Step

### Devirtualize unraids

i removed 2 m1015s from my head server and installed them in two Asrock motherboards in each Norco case. I purchased the following components

- Motherboad: 2x [ASRock H87M PRO4](https://www.amazon.com/gp/product/B00FIWSIVS/ref=oh_details_o05_s00_i00?ie=UTF8&psc=1)
- CPU: 2x [Intel I3-4130T](https://www.amazon.com/gp/product/B00EUVEFEC/ref=oh_details_o07_s00_i01?ie=UTF8&psc=1)
- RAM: 1X [Crucial Ballistix Sport 8GB Kit](https://www.amazon.com/gp/product/B006WAGGUK/ref=oh_details_o07_s00_i00?ie=UTF8&psc=1)

### Set up the new virtualization host

installed Ubuntu 12.04.3 LTS, with zfs, docker and kvm support. hard disks were used as follows

<table>
<thead>
	<td>Qty. &nbsp;</td>
	<td>Item</td>
	<td>Filesystem/Layout</td>
	<td>Usage</td>
</thead>
<tbody>
<tr>
	<td>1x</td>
	<td>120Gb SSD &nbsp;</td>
	<td>ext4</td>
	<td>boot and general purpose (/home, etc.)</td>
</tr>
<tr>
	<td>2x</td>
	<td>2Tb HD</td>
	<td>luks encrypted zfs mirror pool &nbsp;</td>
	<td>encrypted backup storage</td>
</tr>
<tr>
	<td>2x</td>
	<td>1.5Tb HD</td>
	<td>zfs mirror pool</td>
	<td>staging area for nzb downloading</td>
</tr>
<tr>
	<td>1x</td>
	<td>0.5Tb HD</td>
	<td>zfs pool</td>
	<td>working area for nzb downloading</td>
</tr>
<tr>
	<td>4x</td>
	<td>1Tb HD</td>
	<td>zfs striped mirror pool</td>
	<td>general purpose storage (databases, etc.)</td>
</tr>
</tbody>
</table>

<br>
having enabled zfs, now i needed to run my apps.

i managed to dockerize nzbget and filebot.

sickbeard was customized based on an image from the docker index

### Profit

great success !!!

![Docker ps command output](/img/docker-ps.jpg)

![Docker images command output](/img/docker-images.jpg)

![htop command output](/img/docker-htop.jpg)

![Zfs pool status](/img/docker-zfspool-1.jpg)

![Zfs pool status continued](/img/docker-zfspool-2.jpg)

![Zfs list command output](/img/docker-zfslist.jpg)

## Conclusion

i'm currently working on a postgresql and gitlab container.
