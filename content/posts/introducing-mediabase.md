---
date: 2014-10-27T12:16:47-05:00
title: Introducing mediabase
author: Juan B. Rodriguez
description: "Mediabase is a proof of concept application, to showcase how to build a decoupled web application, using Go as back end and AngularJS as front end."
cover: /img/mediabase.jpg
tags: ["go", "poc"]
---

**tl;dr** _mediabase_ is a proof-of-concept application to catalogue a media library consisting of movies. It scans the folders you choose looking for movies, then fetch metadata from [TheMovieDB](https://www.themoviedb.org) and [The OMDB API](https://www.omdbapi.com) and present the information in a nice web page.

Check the [Github page](https://github.com/apertoire/mediabase) for binaries, source code and other general instructions.

## Rationale

The main driver to develop this application was to increase my knowledge of the underlying technologies that power the app.

I will follow up with two additional posts to go into the details of building the app: the first part about the server code and the second part about the client code.

But now, let's take a small tour to go over the features.

## First Run

Upon first run, you are prompted to enter the folder where your movie collection is stored. This has to be a path relative to the machine where the server is running.

The scanner expects the same naming convention as the one used by popular media apps such as [Plex](https://plex.tv), [MediaBrowser](https://mediabrowser.tv), [JRiver Media Center](https://www.jriver.com) and others.

![App Settings](/img/mediabase-settings.jpg)

## Importing media

Once you have entered a folder, click on the IMPORT button to start importing media.

![Media Import page ](/img/mediabase-import.jpg)

The process will search for movies, look them up in [TheMovieDB](https://www.themoviedb.org) and [The OMDB](https://www.omdbapi.com), collect all the metadata, store it in a database and then make them available via a web page.

## Cover screen

The first screen you'll see after import is done is the cover screen (here's showing just a portion of the screen).

![App Cover page](/img/mediabase-cover.jpg)

This view shows the most recently imported movies and is the default screen when you open the app.

## Movie Details screen

When you click the Movies menu option, a new page is shown, with a more detailed view of the movies, where you can filter or sort by different criteria.

![Movies Details page](/img/mediabase-details.jpg)

It shows the poster, a backdrop, running time, IMDB rating, director, actors, country, genres, resolution (if your naming structure contained a resolution field), location, last time watched (if watched) and the date it was added to the application.

Additionally, it has fields where you can fix the TMDB id (if the automatic metadata fetcher picked the wrong movie) and you can set a date and rating for a movie you watched. (see the end of the article for some caveats regarding the fix TMDB id functionality).

You can sort movies by different criteria, as seen below

![Sort Criteria](/img/mediabase-sort.png)

Also, you can filter movies, by searching as you type (with a small delay to prevent too much traffic), again by different criteria

![Filter Criteria](/img/mediabase-filter.png)

You have to see it to believe it, it's working pretty smooth.

## Tools

In addition to importing movies, you can either search for duplicates or prune movies that are no longer stored in the media folders.

- Duplicates<br>
  Works by comparing title names, it's pretty basic at this moment.

- Prune<br>
  Deletes from the database all movies that are missing from the folder where they're supposed to be located. Since this has the potential to wipeout precious data you've collected about your movie (such as watched date, you may have fixed the TMDB id, etc), you need to use it with caution (in fact, i will disable it for the first public release).

## About

Finally there's a nice about page, mostly giving credit where it's due :)

![About Page](/img/mediabase-about.jpg)

## Caveats

There a couple of things that don't work as I'd want them to:

- When fixing a movie via TMDB id, the information is not immediately refreshed (this will be fixed in a future release)
- The date field (to set a date when you watched the movie) has a picker which works fine in Chrome (Mac), but wouldn't in Safari (Mac). I tried a cross-browser solution, but it didn't initially work (this will be fixed in a future release)
- Chrome at some point in time crashes (just the page containing the app), due to memory usage. Safari churns happily along no matter what you throw at it. This has to do with the fact that I'm blindly loading pics of megabytes in size, which is certainly not optimal. (this will be addressed in a future release)
- General error checking (can improve it to be more robust under different scenarios)
- General ui validations (no empty fields when saving/fixing, etc.)
