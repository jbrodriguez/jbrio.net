---
title: "React Native app built with zustand and tailwind"
date: 2021-07-18T08:09:41-05:00
author: Juan B. Rodriguez
description: "Migrate React Native app from redux/sagas to zustand and implement tailwindcss along the way"
cover: rn-zustand-feature.png
tags:
  [
    "react-native",
    "zustand",
    "tailwind",
    "redux",
    "sagas",
    "state-management",
    "react",
    "javascript",
    "typescript",
  ]
---

## Introduction

In this article I'm going to share my impressions after migrating my React Native app from [redux](https://reduxjs.org)/[sagas](https://redux-saga.js.org/) to [zustand](https://github.com/pmndrs/zustand) for state management.

The app is [ControlR](https://www.apertoire.com/controlr/), a mobile app to manage [Unraid](https://unraid.net/) servers.

## What is Unraid ?

[Unraid](https://unraid.net/) is a software solution for storing your media content in-house.

I purchased my first Pro license in 2010 and the second one in 2013.
I'm sort of an early adopter, being among the first 2.5k owners of a key :)

I have a third license (Plus), which was very graciously offered by the Unraid owners to support the development of ControlR for Unraid.

Today's approach of storing content in the cloud & subscribing to multiple streaming services is convenient, but it does have some down sides:

- Content can diseappear from time to time
- You need to over subscribe in order to access all the content you want
- You're not really in control of the media you want to consume

Unraid is a solution that helps you overcome these issues.

## What about ControlR ?

[ControlR](https://www.apertoire.com/controlr/) is a React Native cross-platform (Android and iOS) mobile app, born out of my necessity of having an easy way to manage my Unraid servers.

I first published it in 2016.

Fast forward to 2021, and having hit the 5 years milestone :), the app was still using the same architecture and UI/UX from day one.

It definitely needed a UI overhaul, to support recent mobile features (notch, system color scheme, etc.)

This led me to create ControlR 5.

{{< img "rn-zustand-servers.png" "servers" >}}

## Architecture

In 2016, the most popular option for state management was [redux](https://redux.js.org/), which I used, as well as [redux-saga](https://redux-saga.js.org/) middleware to handle business logic.

I really like how `redux`/`sagas` helps you keep the business logic separate from the UI.

Conceptually, you get a very clear MVC (Model/View/Controller) pattern.

For example, I had a metrics saga to collect analytics, taking advantage of redux's single store centralized actions flow.

```javascript
const SCollect = function* GSCollect(action) {
  if (!__DEV__ && action.meta) {
    let content = JSON.stringify(action.payload);
    Analytics.trackEvent(action.type, {
      payload: content,
    });
  }
};

export const sagas = {
  collect: takeEvery("*", SCollect),
};
```

This is completely separate from the code that defines and renders the UI.

Using redux did mean you needed to write quite a lot of boilerplate code, but this can be solved today by using [Redux Toolkit (RTK)](https://redux-toolkit.js.org/), as well as [RTK Query](https://redux-toolkit.js.org/rtk-query/overview).

When I started working on the rewrite of the app (at the beginning of 2020), I actually started with RTK and it reduced the boilerplate dramatically.

```javascript
const env = createSlice({
  name: "env",
  initialState: envInitialState,
  reducers: {
    setup: (state, { payload }: PayloadAction<EnvSetup>) => {
      state.colors = themes[payload.theme];
      state.version = payload.version;
    },
    setRefreshing: (state, { payload }: PayloadAction<boolean>) => {
      state.refreshing = payload;
    },
    setLoadingApps: (state, { payload }: PayloadAction<boolean>) => {
      state.loadingApps = payload;
    },
  },
  extraReducers: {
    [setTheme.type]: (state: EnvState, { payload }: PayloadAction<Theme>) => {
      state.colors = themes[payload];
    },
  },
});
```

I had to suspend the rewrite, though, due to the real-life&trade; well known events.

That code laid dormant for about a year, until I had to release an app update to fix an issue users were reporting.

At that point in time, I decided to explore state management alternatives.

But before digging into that, let me briefly mention [tailwindcss](https://tailwindcss.com/).

## Styling

The previous version of the app used [react-native-tachyons](https://github.com/tachyons-css/react-native-style-tachyons), which one could argue is a precursor of tailwind.

I've always enjoyed functional styling libraries, for how immediate they are when applying style to a component/element and the learning curve is a matter of hours, few days at most.

I decided to switch from tachyons to tailwind because I had already used it for a web app and enjoyed doing so.

Out of the box, `tailwindcss` offered everything I needed to style my mobile app, so I was very satisfied with how everything turned out.

## Enter zustand

I took a look at [react-query](https://react-query.tanstack.com/), [zustand](https://github.com/pmndrs/zustand), [jotai](https://github.com/pmndrs/jotai) and [recoil](https://recoiljs.org/), eventually settling on `zustand`.

It's a very easy to use but quite powerful library, hooks based, with built-ins such as persistence and a strong redux likeness.

My redux env slice became the zustand env store:

```javascript
const useEnvStore = create<Env>(
  persist(
    (set) => ({
      hydrated: false,
      firstRun: true,
      clearFirstRun: () => set({ firstRun: false }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'env',
      getStorage: () => storage,
      whitelist: ['firstRun'],
      onRehydrateStorage: () => (state, error) => {
        if (state) {
          state.setHydrated()
        }
      },
    },
  ),
)
```

Most of the code here is for setting up persistence.

It's concise yet expressive.

## Redux vs Zustand

Redux and sagas allowed great control of the overall app flow, sagas excel at that kind of orchestration, I could even navigate screens from sagas.

With zustand it feels like you have more UI coupling.

I think you can eventually move everything into zustand store actions, but I still need to dig a bit deeper into it.

For example, one feature that was very easy with redux/sagas was navigate to the detail screen of a server if there was only one item in the list.

I haven't found a way to replicate this with zustand (aided by my existing constraints), although I haven't put a lot of effort into it yet.

I've also experienced some verbosity: binding state and actions can get a bit repetitive, although I've read this can be improved.

```javascript
const order = useServers((state) => state.order);
const setCurrent = useServers((state) => state.setCurrent);
const servers = useServers((state) => state.items);
const refreshing = useServers((state) => state.refreshing);
const refresh = useServers((state) => state.refresh);
const deleteServer = useServers((state) => state.deleteServer);
```

## Conclusion

zustand works perfectly for my app and I have enjoyed using it.

There are other features I want to implement (use immer for example), I'll tackle them as part of the learning process in upcoming releases.

## Addenda

Check out [Unraid](https://unraid.net), it's extremely versatile and once you're in, you will be hooked.

The [Spaceinvader One](https://www.youtube.com/c/SpaceinvaderOne) Youtube channel has many tutorials on getting the most out of your Unraid server.

Also check out [ControlR for Unraid](https://www.apertoire.com/controlr/), I can assure it'll help you manage your Unraid servers (shameless plug 🙌 )

[Let me know any comments/suggestions you may have](https://twitter.com/jbrodriguezio/status/1416771768551940100)
