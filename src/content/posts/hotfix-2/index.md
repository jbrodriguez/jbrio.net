---
title: hotfix 2
author: Juan B. Rodriguez
date: 2012-08-06T23:23:23-00:00
description: 'Share an encrypted zfs pool after being mounted.'
cover: ./hotfix2-feature.jpg
caption: 'hotfix 2'
status: published
tags:
  - zfs
  - encryption
  - unraid
  - esxi
---

i've built my esxi box (skynet) ... find some additional info at <a href="https://lime-technology.com/forum/index.php?topic=21514.0" title="skynet + hal &amp; wopr (esxi head + 2 unraid das)" target="_blank">the unraid forums</a>

something i wanted to document. the command sequence to share the encrypted zfs filesystem after boot is

```bash
$ sudo zfs mount -a (asks for the passphrase)
$ sudo zfs set share=name=export_backup,path=/export/backup,prot=nfs backup/data
```

the latter command is based on my setup
also, oracle recently published an article on [How to manage ZFS Data Encryption](https://www.oracle.com/technetwork/articles/servers-storage-admin/manage-zfs-encryption-1715034.html), with more details about zfs data encryption.

i haven't processed it yet, but it's worth a read
