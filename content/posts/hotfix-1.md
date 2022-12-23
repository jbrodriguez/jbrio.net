---
title: hotfix 1
author: Juan B. Rodriguez
date: 2012-05-07T23:23:23-00:00
description: "Mount an encrypted zfs pool after system boot."
cover: /img/hotfix1.jpg
tags:
  - zfs
  - osx
  - crashplan
  - truecrypt
---

well, i need to add a couple of comments after my last post

i deliberately chose to create the zfs dataset with a passphrase encryption method. as per solaris docs, this means it can't mount it at boot time. the best practice would be a boot time prompt (a la TrueCrypt in windows), but until that time comes, i will live with loading after booting, using the following:

{{< highlight bash >}}
$ sudo zfs mount -a
$ sudo zfs set share tank/backup
{{</ highlight >}}

here seems to be a better way by doing zfs set key -l, but docs are scarce

you can check whether the folder is nfs exported by doing:

{{< highlight bash >}}
$ showmount -e
{{</ highlight >}}

if you were to run crashplan on the zfs box, i would have to think that since the folder is empty upon boot, crashplan would detect it as deleted files. i need to investigate a bit further

on the mac side, the disk utility method to mount the nfs export is not working correctly ... i resorted to

{{< highlight bash >}}
$ mount_nfs zfsbox:/export/Backup /local_mountpoint
{{</ highlight >}}

this shows the mountpoint from the finder correctly [check some discussion about it here](https://help.bombich.com/discussions/questions/3459-cloningcopying-to-or-from-an-nfs-share)
