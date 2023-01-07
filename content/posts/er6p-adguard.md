---
date: 2021-03-26T17:03:32-05:00
title: "Running AdGuard Home on an EdgeRouter 6P"
author: Juan B. Rodriguez
description: "Run a dns sinkholing tool on the router instead of a separate server to remove potential points of failure "
cover: /img/er-agh-adguard.jpg
tags:
  - adguard
  - edgeos
  - edgerouter
images: ["/img/er-agh-adguard.jpg"]
---

## Introduction

I've recently switched from running [vyos](https://vyos.io/) on a custom-built router to [edgeos](https://www.ui.com/) on an [EdgeRouter 6P](https://www.amazon.com/gp/product/B07BMJ91Q8/ref=ppx_yo_dt_b_asin_title_o03_s00?ie=UTF8&psc=1).

Both solutions are derived from the [vyatta router](https://en.wikipedia.org/wiki/Vyatta).

vyos still keeps its open source roots and has recently gone through a sweeping change of the software architecture, bringing it closer to modern standards.

edgeos commercialized the software, adding hardware to its product line, as well as beautiful user interface on top of the always present command line interface.

In any case, the biggest win this change brought for me has been power consumption: the ER6P barely draws 7w when it's busy, normally hovers around 6.5w.

My previous router normally hovered above 20w.

## First steps

Since I was using vyos, I was able to reuse some of the configuration commands, in order to shape traffic the way I needed.

The only thing I've been unable to find is `fq-codel` for the shaper traffic policy, but so far so good in terms of my expectations.

## No more tracking

I was aware of pihole and people using it to prevent tracking at the network level.

Articles such as

[Mmm... Pi-hole...](https://www.troyhunt.com/mmm-pi-hole/)

[Securing DNS across all of my devices with Pi-Hole + DNS-over-HTTPS + 1.1.1.1](https://scotthelme.co.uk/securing-dns-across-all-of-my-devices-with-pihole-dns-over-https-1-1-1-1/)

[Block Ads at a Network Level with Pi-Hole and an Ubiquiti EdgeRouter](https://www.thepolyglotdeveloper.com/2020/10/block-ads-network-level-pi-hole-edgerouter/)

really made me want to try this out.

## The berry is darker on the other side

So I purchased a Raspberry Pi 4, installed pi-hole and just sat and watched how many requests were being blocked

![pihole](/img/er-agh-pihole.png)

Life was good !

But I started thinking about the whole setup and what bothered me was the fact that the pi needed to be always up, otherwise I'd lose dns resolution.

What some people do is have a backup pi, but I didn't really see that much benefit in that.

## Enter the new contender

So I looked at some alternatives, I ruled out installing pihole on the router, and then, almost by chance, I found out about [AdGuard Home](https://adguard.com/en/adguard-home/overview.html) ([github](https://github.com/AdguardTeam/AdGuardHome)).

It's built with [go](https://golang.org/), so I knew it could run almost anywhere.

I ran it as a docker in one of my linux boxes to get a taste and it worked really great.

That's when I decided to install it on the EdgeRouter 6P.

## Fast track to sweetness

After some careful considerations, I settled on the following architecture

- The router has Cloudflare's 1.1.1.2 and 1.0.0.2 as its name servers, so it has its own route to name resolution.
- LAN clients are fed 192.168.3.1 as their dns server, which is handled by AGH on port 53.
- AGH upstream server is Cloudflare Dns-Over-Https
- I also set up some custom rules to delegate local domain queries to the dnsmasq service running on the router
- Anything that is not 192.168.3.1, is being forced to go through AGH for dns

![diagram](/img/er-agh-adguard-diagram.png)

## Step by Step

### Set system name servers

![system nameservers](/img/er-agh-system-ns.png)

### Change dnsmasq port and set dns server for dhcp clients

![dnsmasq](/img/er-agh-dnsmasq.png)
The dnsmasq options allow us to do the following:

```bash
# set the default dns server for dhcp clients
dhcp-option=6,192.168.3.1

# set the port where dnsmasq listens on
port=5353
```

Also note that I told dnsmasq to use the system's name servers (we'll check that later with the full set of cli commands)

### Set up AdGuard Home

This is one the trickier things in this whole setup.

We need AGH to be available in these 2 scenarios

- router restart
- router firmware upgrade

In the first case, turns out AGH helps us with its `-s install` argument. It creates systemd services that just work :)

For the second case, my approach was to create a `/config/adguard` folder, and make everything AGH-related to live there.

Let's get down to the details

- Set up the folders

```bash
mkdir -p /config/{config,work}
```

- Install AGH

```bash
cd /config
curl -sL https://static.adguard.com/adguardhome/release/AdGuardHome_linux_mips64_softfloat.tar.gz | tar xvz
mv AdGuardHome bin
```

tar creates a /config/AdGuardHome folder, which we move to a bin folder

_note_: confirm whether your router is little-endian architecture or not, as there are different binaries for each architecture.

- Set up AGH

```bash
cd /config/bin
sudo ./AdGuardHome -c /config/adguard/config/AdGuardHome.yaml -w /config/adguard/work
```

Just follow the instructions, set AGH to listen on the lan interface and the web ui on some port other than 80, since it's owned by the edgeos web ui

Now set up the upstream dns server and dns resolution for local domains

![upstream](/img/er-agh-upstream.png)

I left the bootstrap servers as per the default

- Make AGH run after restarts

```bash
sudo ./AdGuardHome -s install -c /config/adguard/config/AdGuardHome.yaml -w /config/adguard/work
```

So I install AGH, to create the systemd service required for it to start during boot

- Make AGH survive a firmware upgrade

I created the following bash script on `/config/scripts/firstboot.d/adguard`, based on [this filesystem layout reference](https://community.ui.com/questions/EdgeOS-file-system-layout-and-firmware-images/b5e5f4c8-20b1-4fae-8689-638ab48cb595) and [this tool to persist debian packages](https://github.com/britannic/install-edgeos-packages)

```bash
#!/usr/bin/env bash

cd /config/adguard/bin

./AdGuardHome -s install -c /config/adguard/config/AdGuardHome.yaml -w /config/adguard/work

cd
```

- Force hardcoded dns to go through AGH

After reading [this article](https://scotthelme.co.uk/catching-naughty-devices-on-my-home-network/) by Scott Helme, I decided it was worth the extra effort.

I modeled the setup based on [this reference](https://github.com/stevejenkins/unifi-linux-utils/blob/master/config.gateway.json/force-dns-to-pihole.json)

```
    nat {
        rule 1 {
            description "Redirect DNS requests"
            destination {
                port 53
            }
            inbound-interface eth1
            inside-address {
                address 192.168.3.1
                port 53
            }
            log disable
            protocol tcp_udp
            source {
                address !192.168.3.1
            }
            type destination
        }
        rule 5011 {
            description "masquerade for DNS to LAN"
            destination {
                address 192.168.23.1
                port 53
            }
            log disable
            outbound-interface eth1
            protocol tcp_udp
            type masquerade
        }
    }
```

## Great Success !!

This is the full set of cli commands needed for this to work

```bash
set system name-server 1.0.0.2
set system name-server 1.1.1.2

set service dns forwarding cache-size 10000
set service dns forwarding listen-on eth1
set service dns forwarding listen-on eth2
set service dns forwarding listen-on wg0
set service dns forwarding options dhcp-option=6,192.168.23.1
set service dns forwarding options port=5353
set service dns forwarding system

set service nat rule 1 description 'Redirect DNS requests'
set service nat rule 1 destination port 53
set service nat rule 1 inbound-interface eth1
set service nat rule 1 inside-address address 192.168.3.1
set service nat rule 1 inside-address port 53
set service nat rule 1 log disable
set service nat rule 1 protocol tcp_udp
set service nat rule 1 source address '!192.168.23.1'
set service nat rule 1 type destination

set service nat rule 5010 description 'masquerade for WAN'
set service nat rule 5010 outbound-interface eth0
set service nat rule 5010 type masquerade
set service nat rule 5011 description 'masquerade for DNS to LAN'
set service nat rule 5011 destination address 192.168.3.1
set service nat rule 5011 destination port 53
set service nat rule 5011 log disable
set service nat rule 5011 outbound-interface eth1
set service nat rule 5011 protocol tcp_udp
set service nat rule 5011 type masquerade
```

## Conclusion

I have my EdgeRouter 6P running AdGuardHome to block ads, without extra hardware thus decreasing potential points of failure.

AdGuardHome uses the same blocklists as pihole, so I can just use those.

I've set up AGH to survive firmware upgrades and reboots, so dns resolution and ad blocking is always available.

## Update (Upgrades)

A new version of AdGuard Home is available, so I'd like to chronicle the process. It's very easy.

ssh into the EdgeRouter 6P, then

```bash
cd /config/adguard
sudo curl -sL https://static.adguard.com/adguardhome/release/AdGuardHome_linux_mips64_softfloat.tar.gz | sudo tar xvz

cd bin
sudo ./AdGuardHome -s uninstall
sudo ./AdGuardHome -s stop

cd ..
sudo rm -rf bin
sudo mv AdGuardHome bin

cd bin
sudo ./AdGuardHome -s install -c /config/adguard/config/AdGuardHome.yaml -w /config/adguard/work
```

That's it !

[Let me know any comments/suggestions you may have](https://twitter.com/jbrodriguezio/status/1377033227005739009).
