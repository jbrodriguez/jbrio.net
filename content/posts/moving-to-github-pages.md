---
title: Moving to Github pages
author: Juan B. Rodriguez
date: 2013-03-03T23:23:23-00:00
description: "Migrate my Wordpress blog (hosted at Rackspace) and a Tumblr page to a statically generated site, powered by Jekyll and hosted at Github Pages."
cover: /img/github.jpg
tags:
  - hosting
  - github
  - rackspace
  - wordpress
  - vertx
images: ["/img/github.jpg"]
---

it all started when i started considering the deployment of the [vert.x](https://vertx.io) app i'm working on.

i will deploy to [OpenShift](https://openshift.redhat.com), but i will also open source the code through [Github](https://github.com).

so, when i was analyzing how to transfer the code over, i came across [Github Pages](https://pages.github.com).

i already had two sites:

- apertoire.net (hosted on [Rackspace](https://rackspace.com))
- apertoire.tumblr.com (hosted on [Tumblr](https://tumblr.com))

the rackspace site held a wordpress blog and some software products i've developed over the years.

i started the tumblr site when [i dove into mac osx](/why-i-m-switching-to-mac-osx/) and there i chronicled some other infrastructure endeavours.

when i started digging into the whole github pages, i found out about custom domains and read a lot of articles about people switching from any blog framework to github pages.

in my case, it makes a lot of sense as well:

- streamlined content creation and publishing (all i need is a text editor and git)
- no more messing around with wordpress
- no more maintenance of the hosted box (no more watching out for ubuntu updates)
- no more hosting fees !!

the hosting fees aren't really that much (about $12 per month), but in the end all savings add up.

for the record, my custom domain transitions was done following instructions on [setting up a custom domain with pages](https://help.github.com/articles/setting-up-a-custom-domain-with-pages)

on my dns registrar ([Namecheap](https://namecheap.com)), it went down like this

![Change A and CNAME records](/img/github-dns.jpg)

my mail hosting is done via google, so i used namecheap's option to "Automatically set MX records necessary for _Google Apps Email_"

dns propagation already happened for me (i did this about an hour ago), so it should be a smooth transtion all things considered.

### Update (Nov 19, 2014)

As per noisebleeds comment below, I'm attaching the updated DNS settings I had to use after Github made some changes to their network routing

![New A and CNAME records settings](/img/github-dns-upd1.jpg)

![New MX record settings ](/img/github-dns-upd2.jpg)
