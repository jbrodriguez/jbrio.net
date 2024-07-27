---
title: '5 ways to update zfs on archlinux'
date: 2024-07-27T13:31:46.612Z
cover: ./5-ways-archlinux-zfs-feature.jpg
caption: 'got it © midjourney'
status: published
description: 'back where you belong'
tags:
  - archlinux
  - zfs
---

## introduction

i have an [archlinux](https://archlinux.org/) server that i use for general purposes ([photoview](https://photoview.github.io/) is one of them), with [zfs](https://openzfs.org/wiki/Main_Page) based storage (i have discussed zfs previously [here](/posts/storage-wars) and [here](/posts/oh-solaris-mio))

i generally update archlinux once a month, but since zfs is not built-in into the kernel, there are times when zfs gets behind newer kernels

additionally, archzfs, which builds zfs for archlinux can sometimes get behind zfs/openzfs

i mitigated this by switching to an lts kernel (linux-lts) and while this helps, i still found myself in a situation where i can't do a full system upgrade due to zfs

there are some potential solutions to this, let's take a look

## the archzfs way

this is the sanctioned way

the [archlinux wiki](https://wiki.archlinux.org/title/ZFS) describes all the steps required to use the archzfs repo to install/upgrade zfs

**cons**

- it can get behind openzfs, which can get behind kernels
- build bot can be down or builds can be failing

## inversion of control (technically not a zfs update)

what if, instead of looking for a zfs-linux-lts to match a new kernel, we go the other way ?

there is a kernel repo that answers the question: is there a matching kernel for my current version of zfs ?

this is all described here
<https://end.re/blog/ebp036_archzfs-repo-for-kernels/#update-on-2020-12-17>

**cons**

- it's highly likely that you will remain on an "older" linux-lts version

## the devtools of summer

so you can build zfs-linux-lts on your own, by installing the appropriate packages on your system: base-devel and devtools will allow you to build and install zfs-linux-lts

i did this on a fresh archlinux install and it worked like a charm

i have to thank hoban, since [his instructions](https://aur.archlinux.org/packages/zfs-linux-lts#comment-948394) were the base for getting this done

as a shortcuts, here are the steps:

```bash
❯ git clone https://aur.archlinux.org/zfs-linux-lts.git

❯ vim PKGBUILD
# <interactive output omitted, see diff below>

❯ git --no-pager diff
diff --git a/PKGBUILD b/PKGBUILD
index aad1ea7..71fdbb3 100644
--- a/PKGBUILD
+++ b/PKGBUILD
@@ -18,9 +18,9 @@
 pkgbase="zfs-linux-lts"
 pkgname=("zfs-linux-lts" "zfs-linux-lts-headers")
 _zfsver="2.2.2"
-_kernelver="6.1.66-1"
-_kernelver_full="6.1.66-1"
-_extramodules="6.1.66-1-lts"
+_kernelver="6.1.68-1"
+_kernelver_full="6.1.68-1"
+_extramodules="6.1.68-1-lts"

 pkgver="${_zfsver}_$(echo ${_kernelver} | sed s/-/./g)"
 pkgrel=1

❯ makepkg -scir
# <package building output omitted>

❯ ls
PKGBUILD  zfs-2.2.2.tar.gz  zfs.install  zfs-linux-lts-2.2.2_6.1.68.1-1-x86_64.pkg.tar.zst  zfs-linux-lts-headers-2.2.2_6.1.68.1-1-x86_64.pkg.tar.zst

❯ pacman -Q | grep 6.1.68
linux-lts 6.1.68-1
linux-lts-headers 6.1.68-1
zfs-linux-lts 2.2.2_6.1.68.1-1
zfs-linux-lts-headers 2.2.2_6.1.68.1-1

❯ uname -r
6.1.68-1-lts
# <the above was post-reboot>
```

the big issue with this ... it didn't work once a new kernel was released

since, the build process looks at the packages in your system, it detects an old version of the kernel and you can't move forward

**cons**

- you have to install base-devel and devtools in your system, which increases the exposed surface area of your server, the less packages you have on a server the better
- it will outright not work when there's a new kernel and you are building on the same system you are running

## one archroot to rule them all

the next best thing is to create an archroot on your system, so you can install a fresh linux kernel on the archroot, then build/install any package you want, in my case, just build

this is a great solution, you don't depend on the kernel version on your system, so you can build the latest kernel + zfs version that supports that kernel (awesome)

in general terms, these are the steps

```bash
mkarchroot "~/chroot/root" linux-lts zfs-utils base-devel
cd ~/chroot
git clone https://aur.archlinux.org/zfs-linux-lts.git
cd zfs-linux-lts
makechrootpkg -c -u -r ~/chroot/root
```

**cons**

- the same caveat as before: you still need to install devtools in your system

## docker for the win

"it's the eyes, chico" ... i mean, it's the dockers, it's always been the dockers :)

i can finally rest

i just created a Dockerfile from archlinux:base-devel, added some packages (no archroot needed), to create a fresh zfs-linux-lts, based on the corresponding linux-lts, all in a very automated way

this is the Dockerfile

```bash
FROM archlinux:base-devel

RUN useradd -m build && \
    pacman -Syu --noconfirm && \
    pacman -Sy --noconfirm git linux-lts && \
    # Allow build to run stuff as root (to install dependencies):
    echo "build ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/build

RUN echo -e "\n[archzfs]\nServer = https://archzfs.com/\$repo/\$arch" >> /etc/pacman.conf && \
    pacman-key -r DDF7DB817396A49B2A2723F7403BD972F75D9D76 && \
    pacman-key --init && \
    pacman-key --lsign-key DDF7DB817396A49B2A2723F7403BD972F75D9D76 && \
    pacman -Syu --noconfirm && \
    pacman --sync --noconfirm --noprogressbar --quiet zfs-utils

# Continue execution (and CMD) as build:
USER build
WORKDIR /home/build

# Build the package
WORKDIR /package

USER root

COPY ./update_pkgbuild.sh /usr/local/bin/update_pkgbuild.sh

RUN chmod +x /usr/local/bin/update_pkgbuild.sh
USER build

# Clone the repository, update PKGBUILD, and build package
CMD git clone https://aur.archlinux.org/zfs-linux-lts.git . && \
    /usr/local/bin/update_pkgbuild.sh && \
    makepkg --syncdeps --clean --rmdeps --noconfirm``Dockerfile
```

and this is the update_pkgbuild.sh script

```bash
#!/bin/bash

lts_version=$(pacman -Qe | grep "^linux-lts" | awk '{print $2}')
if [ -z "$lts_version" ]; then
    echo "Error: linux-lts version not found"
    exit 1
fi

full_kernel_version=$lts_version

sed -i \
    -e "s/^_kernelver=.*/_kernelver=\"$full_kernel_version\"/" \
    -e "s/^*kernelver*full=.*/*kernelver*full=\"$full_kernel_version\"/" \
    -e "s/^_extramodules=.*/_extramodules=\"$full_kernel_version-lts\"/" \
    PKGBUILD

echo "PKGBUILD updated with linux-lts version $full_kernel_version"
```

the cherry on top:

create a [custom local repository](https://wiki.archlinux.org/title/Pacman/Tips_and_tricks#Custom_local_repository), so you can just invoke `pacman -Syu` and it will pickup the zfs-linux-lts you just built

### bonus round & final thoughts

there's another way to update zfs, described [here](https://github.com/archzfs/archzfs/issues/540#issuecomment-2241501637)

the main driver for this article are these 2 github issues

- [why are you providing zfs 2.2.4 for kernel 6.9.x? · Issue #538 · archzfs/archzfs](https://github.com/archzfs/archzfs/issues/538)
- [ci.archzfs.com down · Issue #540 · archzfs/archzfs](https://github.com/archzfs/archzfs/issues/540)

### comment about the article here

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">i found myself unable to upgrade my archlinux system due to zfs falling behind newer kernels<br><br>so i started digging and found<br><br>5 ways to update zfs on archlinux</p>&mdash; Juan B. Rodriguez (@jbrodriguezio) <a href="https://twitter.com/jbrodriguezio/status/1817223624442413252?ref_src=twsrc%5Etfw">July 27, 2024</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
