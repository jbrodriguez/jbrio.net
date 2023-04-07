---
title: vaultee
author: Juan B. Rodriguez
date: 2013-03-30T23:23:23-00:00
description: "A proof of concept web application to keep track of items you own, written in Vert.x"
cover: /img/vaultee.jpg
tags:
  - vert.x
  - angularjs
  - bootstrap
images: ["/img/vaultee.jpg"]
---

## Introduction

`vaultee` is a proof of concept web app, designed to showcase mostly vert-x and angular.js capabilities.

what it does, is keep track of different properties (assets) that you own, and automatically version each change performed (revisions), so you can go back in time to check.

it is mostly suited to keep track of computer builds, but it can easily be extended to other kind of assets (thinking home theater setups and such).

## Rationale

[`Vert.x`](https://vertx.io) is a great framework to build web applications.

Applications are built on top of verticles, which perform their duties and communicate via a message passing bus architecture, that extends all the way to the client layer.

It's a powerful concept. Concurrency is managed via an actors paradigm and message passing makes it very simple to communicate among all pieces of the software.

There are similar frameworks or libraries that use the underlying concept of actors, at different levels:

- [Erlang](https://www.erlang.org/)
- [Play Framework](https://www.playframework.com/)
- [Retlang](https://code.google.com/p/retlang/)
- [Meteor](https://www.meteor.com/)

But I believe only vert.x allows mixing different languages to build your application.

The other main component is [`AngularJS`](https://www.angularjs.org/). It provides a framework to structure apps on the client side, greatly simplifying your code.

Finally, [`Bootstrap`](https://twitter.github.com/bootstrap/) and a free theme from [`bootswatch`](https://bootswatch.com/), provide the eye candy.

## Source Code

The code is alpha level, and I'm looking forward to get it reviewed by people more experienced than me.

Please do send comments and pull requests !

[It's available at Github](https://github.com/apertoire/vaultee)

## Screenshots

Home page, after login, showing all existing assets

{{< img "/img/vaultee-all.png" "Home page listing all assets" >}}

Displaying one of the assets (currently on revision 2)

{{< img "/img/vaultee-one.png" "Display one asset" >}}
