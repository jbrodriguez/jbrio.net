---
title: "A New Face"
date: 2023-02-25T10:29:18-05:00
cover: /img/a-new-face-cover.jpg
coverCaption: "foundations © Juan B. Rodriguez"
images: ["/img/a-new-face-cover.jpg"]
description: "a new look for my site"
tags:
  - hugo
  - gatsby
  - tailwindcss
  - theme
  - article
---

# Introduction

Following on the steps of [consolidating my online presence into jbrio.net](/posts/consolidation), I've decided to also revamp the look of my site.

# Background

Since my site is powered by [hugo](https://gohugo.io/), I started with a simple existing theme, [hello-friend-ng](https://github.com/rhazdon/hugo-theme-hello-friend-ng).

<div class="grid grid-flow-row grid-cols-3">
  <div class="px-2 py-2 mb-10 outline-none hover:border-orange-700 border-transparent border-2 hover:border-current rounded-md  duration-500">
    <a href="/img/a-new-face-1.png" target="_blank">
      <div class="overflow-hidden">
        <img src="/img/a-new-face-1.png" class="object-none h-144 w-96 rounded" />
      </div>
    </a>
  </div>  
  <div class="px-2 py-2 mb-10 outline-none hover:border-orange-700 border-transparent border-2 hover:border-current rounded-md  duration-500">
    <a href="/img/a-new-face-2.png" target="_blank">
      <div class="overflow-hidden">
        <img src="/img/a-new-face-2.png" class="object-none h-144 w-96 rounded" />
      </div>
    </a>
  </div>  
  <div class="px-2 py-2 mb-10 outline-none hover:border-orange-700 border-transparent border-2 hover:border-current rounded-md  duration-500">
    <a href="/img/a-new-face-3.png" target="_blank">
      <div class="overflow-hidden">
        <img src="/img/a-new-face-3.png" class="object-none h-144 w-96 rounded" />
      </div>
    </a>
  </div>  
</div>

It looked pretty good to me, it was based on the [Inter font](https://rsms.me/inter/), which is really pleasing to the eye.

Although the default font size was a reasonable 16px, i wanted to push it to 20px.

I tried to change it via the hook points the theme provides, but it didn't work the way i expected.

At about the same time, I found out about [gatsby theme minimal blog](https://github.com/LekoArts/gatsby-themes/tree/main/themes/gatsby-theme-minimal-blog) and really liked the look of it.

# The New Theme

I decided to switch, however a Gatsby theme is very different from a Hugo theme, so at first I looked for a port and that was nowhere to be found.

In the end, I decided to just replicate it in Hugo and that gave way to the new theme you see here today.

I used [tailwindcss](https://tailwindcss.com/) in the process, which made it easier.

It's pretty similar, although it still needs some tweaking.

# Conclusion

I'm pretty happy with the result, I think it looks a lot better than the previous one.

**_Note:_** _I may eventually open source my hugo them, when I figure out how to do it (since it uses tailwind, thus a node environment and all)_
