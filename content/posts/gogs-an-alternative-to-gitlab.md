---
date: 2015-03-15T09:20:31-05:00
title: Gogs, an alternative to Gitlab
author: Juan B. Rodriguez
description: "A comparison of the features of Gogs vs Gitlab. It includes a Gogs docker implementation."
cover: /img/gogs.jpg
featured: ["Featured"]
tags: ["git", "gogs", "gitlab", "docker"]
images: ["/img/gogs.jpg"]
---

**tl;dr** [Gitlab](https://gitlab.com) is a great git hosting service, almost as powerful as [Github](https://github.com). But, is there something out there that's comparable to Gitlab/Github, yet simpler to manage ? I think [`Gogs`](https://gogs.io) does the job.

## Introduction

These days, Github has become the preferred platform to host code. With its many great features, ease of use and access, almost all software developers are happily using it.

Also, since [Google Code hosting project is closing down](https://arstechnica.com/information-technology/2015/03/google-to-close-google-code-open-source-project-hosting/), you can expect more projects being driven to it.

But what if you're writing some Android app, maybe you're building the next great iOS game or in general, you're writing some code that you don't want to be exposed to the general public ?

You could certainly purchase access to private Github repositories, but most certainly you'd rather want to invest your capital in more pressing matters.

This is where software such as Gitlab, and Gogs, come very handy.

They provide a service very similar to Github, with the difference that you can host them in your own servers, even in your own workstation.

Read on for some more insight.

## Gitlab

Gitlab is a powerful git service, with features that rival Github itself. It's a mature project and it's being continuously updated.

![gitlab](/img/gogs-gitlab-shot.jpg)

They recently acquired [Gitorius](https://gitorious.org/) (another Github-like service), so you can only assume that the feature set will expand ([check the press clip about the acquisition](https://thenextweb.com/insider/2015/03/03/gitlab-acquires-rival-gitorious-will-shut-june-1/)).

Installation has been undoubtedly improved since the 'manual' days, which was time-consuming and very error prone.

Now there's a Linux deb/rpm package available (called the Omnibus), which handles all dependencies and simplifies the process.

Upgrading is a bit more convoluted, especially if you're coming from a version that's prior to the last, but all in all, it's not that complicated.

Nevertheless, you can feel a lot of stuff is going on behind the scenes. You will be running Sidekiq, Unicorn, Nginx, Ruby (plus all its gems) and then Gitlab itself.

Customizing the install is not that simple and if something should go wrong, there are many moving parts, where you would have to go looking for problems.

## Enter the One binary

On the other hand, we have [Gogs](https://gogs.io). A single binary is all you need to run it.

It's built with [Go](https://golang.org), so you automatically get cross-platform compatibility.

It runs on Windows, Mac, Linux, ARM, etc.

![gogs](/img/gogs-shot.png)

Installation simply requires unzipping the release archive into a chosen folder. That's it. Upgrading works the same: just unzip the release archive.

That's the beauty of [Go's](https://golang.org) binary deployments, you can target multiple platforms at once.

Gogs has a really low footprint, so it's easy on system resources (it can run on a [Raspberry Pi](https://www.raspberrypi.org)).

You could run it as is, with the default configuration, or do some minimal tweaking.

The default configuration file is located in \<install folder\>/conf/app.ini, but the [documentation suggests](https://gogs.io/docs/installation/configuration_and_run.html) to write your changes in \<install folder\>/custom/conf/app.ini, so that when you upgrade, your customizations are preserved (since conf/app.ini is overwritten).

There are three sensible changes you could consider:

- Repository location

{{< highlight bash >}}
[repository]
ROOT = !! this is the location where you want to keep the repositories !!
{{</ highlight >}}

<br>

- Database location

{{< highlight bash >}}
[database]
PATH = !! this is the location of your database (sqlite3 by default) !!
{{</ highlight >}}

<br>

- Public key to enable commit over ssh

![SSH Keys Management page](/img/gogs-sshkey.jpg)

Note that currently, you need to run an ssh server ([openssh](https://www.openssh.com) will do fine), the same as Gitlab.

## Comparison

Let's compare both products to see how they match up in terms of feature set. I'll throw in Github, as a reference.

<div class="table">
	<table class="pricing">
		<tbody>
		<tr>
			<th><h3 class="tableheader">Feature</h3></th>
			<th><h3 class="version"> Gogs</h3></th>
			<th><h3 class="version"> Gitlab</h3></th>
			<th><h3 class="version"> Github</h3></th>
		</tr>

    	<tr>
    		<td>Dashboard &amp; File Browser</td>
    		<td><span class="yes">yes</span></td>
    		<td><span class="yes">yes</span></td>
    		<td><span class="yes">yes</span></td>
    	</tr>

    	<tr>
    		<td>Issue Tracking, Milestones &amp; Commit keywords</td>
    		<td><span class="yes">yes</span></td>
    		<td><span class="yes">yes</span></td>
    		<td><span class="yes">yes</span></td>
    	</tr>

    	<tr>
    		<td>Organizations support</td>
    		<td><span class="yes">yes</span></td>
    		<td><span class="yes">yes</span></td>
    		<td><span class="yes">yes</span></td>
    	</tr>

    	<tr>
    		<td>Wiki</td>
    		<td><span class="no">no</span></td>
    		<td><span class="yes">yes</span></td>
    		<td><span class="yes">yes</span></td>
    	</tr>

    	<tr>
    		<td>Code Review</td>
    		<td><span class="no">no</span></td>
    		<td><span class="yes">yes</span></td>
    		<td><span class="yes">yes</span></td>
    	</tr>



    	<tr>
    		<td>Code Snippets</td>
    		<td><span class="no">no</span></td>
    		<td><span class="yes">yes</span></td>
    		<td><span class="yes">yes</span></td>
    	</tr>

    	<tr>
    		<td>Web Hooks</td>
    		<td><span class="yes">yes</span></td>
    		<td><span class="yes">yes</span></td>
    		<td><span class="yes">yes</span></td>
    	</tr>

    	<tr>
    		<td>Git Hooks</td>
    		<td><span class="yes">yes</span></td>
    		<td>* Enterprise</td>
    		<td>* Enterprise</td>
    	</tr>

    	<tr>
    		<td>LDAP Login</td>
    		<td><span class="yes">yes</span></td>
    		<td><span class="yes">yes</span></td>
    		<td><span class="yes">yes</span></td>
    	</tr>

    	<tr>
    		<td>LDAP Group Sync</td>
    		<td><span class="no">no</span></td>
    		<td>* Enterprise</td>
    		<td>* Enterprise</td>
    	</tr>

    	<tr>
    		<td>Branded Login Page</td>
    		<td><span class="no">no</span></td>
    		<td>* Enterprise</td>
    		<td>* Enterprise</td>
    	</tr>

    	<tr>
    		<td>&nbsp;</td>
    		<td>&nbsp;</td>
    		<td>&nbsp;</td>
    		<td>&nbsp;</td>
    	</tr>

    	<tr>
    		<td>Language</td>
    		<td>Go</td>
    		<td>Ruby</td>
    		<td>Ruby</td>
    	</tr>

    	<tr>
    		<td>Platform</td>
    		<td>Cross-Platform</td>
    		<td>Linux</td>
    		<td>* Virtual Machine</td>
    	</tr>

    	<tr>
    		<td>License</td>
    		<td>MIT</td>
    		<td>MIT</td>
    		<td>Proprietary</td>
    	</tr>


    	<tr>
    		<td>Resource Usage</td>
    		<td>Low</td>
    		<td>Medium/High</td>
    		<td>Medium/High</td>
    	</tr>
    	</tbody>
    </table>

</div>

<br>
Code Review (and pull requests) is arguably the most important missing feature. It's at the top of the list among [Gogs Github issues](https://github.com/gogits/gogs/issues/5) and Gogs's main developer ([Unknwon](https://github.com/Unknwon)) is working on it.

But all said, you have a very functional private Git host service.

## Running a Gogs docker

I [previously described](/dockeritazion) how I 'dockerized' my home server environment, so it's only fitting that I would run gogs as a Docker container.

So let's do it step by step.

I have an apps folder in my server home directory (/home/kayak/apps) and create subfolders per each app I deploy as a Docker container.

Download and unzip the latest version (use the archive that corresponds to your platform)

{{< highlight bash >}}
$ cd /home/kayak/apps
$ wget https://gogs.dn.qbox.me/gogs_v0.5.13_linux_amd64.zip
$ unzip gogs_v0.5.13_linux_amd64.zip
$ rm gogs_v0.5.13_linux_amd64.zip
{{</ highlight >}}

<br>

### Optional | Customize the configuration

{{< highlight bash >}}
$ cd gogs
$ mkdir -p custom/conf
$ cd custom/conf
$ nano app.ini
{{</ highlight >}}

{{< highlight bash >}}
[repository]
ROOT = !! this is the location where you want to keep the repositories !!

[database]
PATH = !! this is the location of your database (sqlite3 by default) !!
{{</ highlight >}}

**_NOTE_**: At this point, you could simply run _gogs web_ and you'd have it running normally, not as docker container.

Let's create our Dockerfile

{{< highlight bash >}}
$ cd /home/kayak/apps/gogs
$ nano Dockerfile
{{</ highlight >}}

{{< highlight docker >}}
FROM ubuntu:14.04

ENV DEBIAN_FRONTEND noninteractive

RUN sed 's/main$/main universe multiverse/' -i /etc/apt/sources.list && \
 apt-get update && apt-mark hold initscripts && \
 apt-get install -y sudo openssh-server git && \
 apt-get clean

EXPOSE 22 3000

RUN addgroup --gid 501 kayak && adduser --uid 501 --gid 501 --disabled-password --gecos 'kayak' kayak && adduser kayak sudo

WORKDIR /home/kayak
ENV HOME /home/kayak

ENTRYPOINT ["/home/kayak/boot"]
{{</ highlight >}}

<br>
The Dockerfile is based on the latest Ubuntu server LTS version (14.04).

We then install sudo, openssh and git, expose ports 22 (for ssh) and 3000 (for the gogs web interface).

Additionally, I generally create a user (_kayak_ in this case) with the same uid/gid as my user in my Mac box, to prevent issues with access permissions.

Finally, the boot shell script is called to get things running.

{{< highlight bash >}}
$ touch boot
$ chmod +x boot
$ nano boot
{{</ highlight >}}

{{< highlight bash >}}
#!/bin/bash

sudo -u kayak -H touch /home/kayak/.ssh/authorized_keys
chmod 700 /home/kayak/.ssh && chmod 600 /home/kayak/.ssh/authorized_keys

# start openssh server

mkdir /var/run/sshd
/usr/sbin/sshd -D &

exec sudo -u kayak /home/kayak/gogs web
{{</ highlight >}}

What this does is run the ssh daemon and then run gogs, as kayak user (rather than root, which is the default).

Let's build the image

{{< highlight bash >}}
$ cd /home/kayak/apps/gogs
$ docker build --rm -t apertoire/gogs .
{{</ highlight >}}

Once the image is built, we can run it with

{{< highlight bash >}}
$ docker run -d --name gogs \
 -v /etc/localtime:/etc/localtime:ro \
 -v /home/kayak/apps/gogs:/home/kayak \
 -p 62723:22 \
 -p 3000:3000 \
 apertoire/gogs
{{</ highlight >}}

You can check the command line to see that it's running.

![Running in terminal](/img/gogs-running.jpg)

Now you can open the web interface, and it will show an install page (for first-time run)

![First-time run install page](/img/gogs-install.jpg)

Once you have completed the install, you'll have a functional Gogs service.

![Web Interface Home Page](/img/gogs.jpg)

## Conclusion

Gogs is a lightweight, easy to set up, cross-platform git hosting service, with features favorably comparable to Gitlab/Github.

It's not as mature as the other two, but it's still incredibly capable.

It's also open source, so you can contribute to improve it.

I replaced my Gitlab installation with Gogs a couple of months ago and haven't looked back.

I'm hosting 42 repositories and have found performance to be extremely good.

I definitely recommend Gogs as your git self-hosting service.

## Final Notes

Hope you found the article interesting.

Please leave your comments here or share on social media.
