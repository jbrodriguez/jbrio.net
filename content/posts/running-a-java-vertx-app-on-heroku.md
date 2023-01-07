---
title: Running a Java Vert.x app on Heroku
author: Juan B. Rodriguez
date: 2013-04-24T23:23:23-00:00
description: "Step by Step on how to run a Java (vert.x) application on one of the popular Paas, in this case, Heroku."
cover: /img/vertx.jpg
tags:
  - vert.x
  - heroku
  - angularjs
  - bootstrap
images: ["/img/vertx.jpg"]
---

That's right. This is Yet Another Running Vert.x on Heroku Article !

It does have some differences with regards to other articles though. Let's see.

You can check the [live app](https://vaultee.herokuapp.com) right now !

## Background

Since I [published the code](/vaultee/) for a proof of concept vert.x/angularjs/bootstrap app on [Github](https://github.com/apertoire/vaultee/), I considered how easy/difficult it would be to make it run on one of the popular Paas.

I first considered [OpenShift](https://openshift.redhat.com/) due to affinity (Vert.x and RedHat have become closer lately), but finally settled on Heroku due to purely personal reasons.

## Research

I can reference back to two resources, which helped me move forward:

- [Running Vert.x Applications on Heroku](https://fbflex.wordpress.com/2012/05/02/running-vert-x-applications-on-heroku/)
- [Setting up a Vert.x Project to Work with Maven and NetBeans IDE 7.1 on OS X and Java 7](https://java.dzone.com/articles/setting-vertx-project-work)

The first resource introduced me to buildpacks and the second showed me maven for app building. It was important because maven is [the suggested way to run Java apps on heroku](https://devcenter.heroku.com/articles/java)

## Step by Step

This is what I did

{{< highlight bash >}}
$ mkdir myapp
$ cd myapp
{{</ highlight >}}

Copied source code from [github](https://github.com/apertoire/vaultee) into this folder and then initialize git

{{< highlight bash >}}
$ git init
$ git add .
$ git commit -m 'initial commit'
{{</ highlight >}}

Create a heroku app via cli (you need to [install heroku toolbelt](https://toolbelt.heroku.com/) first)

{{< highlight bash >}}
$ heroku create myapp --stack cedar --buildpack https://github.com/apertoire/heroku-buildpack-vertx.git
{{</ highlight >}}

I modified the buildpack to support a java maven code structure, borrowing concepts from where [it was forked](https://github.com/enr/heroku-buildpack-vertx), and from the [official heroku java buildpack](https://github.com/heroku/heroku-buildpack-java).
You can now push your code to heroku, to deploy it

{{< highlight bash >}}
$ git push heroku master
{{</ highlight >}}

Next, I needed to initialize the postgresql backend.

I ended up using [pg-transfer's heroku plugin](https://github.com/ddollar/heroku-pg-transfer), after reading about [postgresql support in heroku](https://devcenter.heroku.com/articles/heroku-postgresql)

First, I found out the name of the postgresql database by running

{{< highlight bash >}}
$ heroku config | grep postgres
{{</ highlight >}}
Then, the actual command to initialize the database was

{{< highlight bash >}}
$ heroku pg:transfer --from postgres://dbuser:dbpassd@dbhost:dbport/dbname --to white --confirm myapp
{{</ highlight >}}

The --from host is my local postgresql server.
The --to host is the heroku postgresql instance and is referenced using heroku's database color naming convention, since it was the only syntax that worked for me.

## A Couple of Notes

In order to run your app on Heroku, they export some environment variables that you need to reference in your code, for things such as port, db host, db port, etc.

So I had to refactor my code to support environment variables, which is arguably a best practice with regards to this matter.

I defined and environment file, which holds this

{{< highlight bash >}}
export PORT=9000
export DATABASE_URL=postgres://dbuser:dbpass@dbhost:dbport/dbname
{{</ highlight >}}

This file is added to .gitignore. Then in server.js I did

{{< highlight javascript >}}
load('vertx.js');

var webConf = {
port: parseInt(vertx.env['PORT']),

    // Configuration for the event bus client side bridge
    // This bridges messages from the client side to the server side event bus
    bridge: true,

    // This defines which messages from the client we will let through
    // to the server side
    inbound_permitted: [
    	{ address: 'load:user' },
    	{ address: 'load:assets' },
    	{ address: 'load:revisions' },
    	{ address: 'load:items' },
    	{ address: 'load:itemTypes' },
    	{ address: 'save:asset' },
    	{ address: 'scrape:item' }
    ],
    	// This defines which messages from the server we will let through to the client
    outbound_permitted: [
    	{}
    ]

};
{{</ highlight >}}

Heroku provides an environment variable PORT and vert.x enables access to it via vertx.env() function.

As for database vars, a bit uglier

{{< highlight javascript >}}
var re = /^(postgres):\/\/(\S+):(\S+)@(\S+):(\S+)\/(\S+)$/;
var db = re.exec(vertx.env['DATABASE_URL']);

// logger.info("protocol: " + result[1]);
// logger.info("username: " + result[2]);
// logger.info("password: " + result[3]);
// logger.info("address: " + result[4]);
// logger.info("port: " + result[5]);
// logger.info("dbname: " + result[6]);

var dalConf = {
host: db[4],
username: db[2],
password: db[3],
port: parseInt(db[5]),
dbname: db[6]
}
{{</ highlight >}}

First we parse the DATABASE_URL variable and then use each separate component.

To run the app locally, I create a shell script, play.sh

{{< highlight bash >}}
source environment
vertx run src/main/javascript/server.js -cp "target/classes:target/dependency/postgresql-9.2-1002.jdbc4.jar:target/dependency/jbcrypt-0.3m.jar:target/dependency/joda-time-2.2.jar:target/dependency/jackson-databind-2.1.4.jar:target/dependency/jackson-core-2.1.4.jar:target/dependency/jackson-annotations-2.1.4.jar:target/dependency/jsoup-1.7.2.jar"
{{</ highlight >}}

So I read in the environment variable and then run vert.x with server.js as the bootstrap code.

On the Heroku side, I created a Procfile similar to my shell script, except for the "source environment" line, since the variables are provided by Heroku

{{< highlight bash >}}
web: vertx run src/main/javascript/server.js -cp "target/classes:target/dependency/postgresql-9.2-1002.jdbc4.jar:target/dependency/jbcrypt-0.3m.jar:target/dependency/joda-time-2.2.jar:target/dependency/jackson-databind-2.1.4.jar:target/dependency/jackson-core-2.1.4.jar:target/dependency/jackson-annotations-2.1.4.jar:target/dependency/jsoup-1.7.2.jar"
{{</ highlight >}}

In both cases, I added all jar dependencies to the classpath, since vert.x uses URLoader to load classes at runtime and it doesn't support wildcards.

But the suggested way to package an app in vert.x is to convert it to a module, which is something I'll look into in the future.

Finally, a note on the [Heroku buildpack](https://github.com/apertoire/heroku-buildpack-vertx).

It looks for a pom.xml file in the main folder. If found, it interprets the code as a vert.x app and starts the build process

During the build, openjdk7 and vert.x are downloaded and then maven is run to download all declared dependencies and to compile java source code.

Then Procfile is executed and the app is live !

## Next Steps

- Maybe we should use a [different layout](https://cliffmeyers.com/blog/2013/4/21/code-organization-angularjs-javascript) for the angularjs code of the app
- A followup article will showcase some of the patterns used for this proof of concept app
