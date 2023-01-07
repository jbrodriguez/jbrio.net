---
date: 2014-11-22T07:50:25-05:00
title: Switching from zsh to fish
author: Juan B. Rodriguez
description: "The experience of installing fish, a fully featured shell, to replace zsh/bash. Includes sample configuration."
cover: /img/fish.jpg
featured: ["Featured"]
tags: ["osx", "fish", "zsh", "shell"]
images: ["/img/fish.jpg"]
---

**_tl;dr_** How easy is it to switch from [zsh](https://www.zsh.org) to [fish](https://www.fishshell.com) ? Is it worth it ?

## Background

In the beginning ... there was [bash](https://www.gnu.org/software/bash/) and all was good.

The built-in OSX terminal catered to my needs whenever I had to wander into shell land.

![Mac OSX Terminal app](/img/fish-terminal.jpg)

## The Road to Enlightenment

But when I started hearing about [iTerm2](https://iterm2.com), themes ([Solarized](https://ethanschoonover.com/solarized), [Tomorrow](https://github.com/ChrisKempson/Tomorrow-Theme), etc.) and dotfiles ([Github dotfiles](https://dotfiles.github.io/), [Holman dotfiles](https://github.com/holman/dotfiles), etc.), there was only one possible outcome: _zsh_.

And I embraced [oh-my-zsh](https://ohmyz.sh/).

The almost infinite amount of themes, functionality I never knew I needed until I used it ([z](https://github.com/sjl/z-zsh), history substring search, syntax highlighting, etc.) made me feel at home.

Bash was just a kindergarten kid compared to my new and all-mighty shell.

I heard some rumors about this shell with a funny name, took a look at the website and said, hey ... zsh does all that already ! You shall not pass !

## Make things as simple as possible, but not simpler

The thing is ... I _strive_ to simplify my work environment as much as I can.

As great as oh-my-zsh is, it brings a lot of baggage. If you want to customize, you need to dig deeper and dedicate a fair amount of time to make it work exactly the way you want.

When I double checked the **fish** documentation, it promised a lot of built-in functionality with minimal fuss if you wanted to extend and customize.

Was that really the case ?

Only one way to find out.

## The Red pill

I took the easy route
{{< highlight bash >}}
$ brew install fish
{{</ highlight >}}
(you are using [Homebrew](https://brew.sh) to install anything on your Mac right ?)

Right out of the box, you get syntax highlighting, command muted suggestion, history substring search
![Command suggestion](/img/fish-suggestions.jpg)

.zshrc is nowhere to be found, instead you have .config/fish/config.sh, which is very similar, only the syntax changes.

This is my config.fish

{{< highlight bash >}}
set -x PATH /usr/local/opt/coreutils/libexec/gnubin $HOME/bin /usr/local/bin /usr/bin /bin /usr/sbin /sbin

set -x GOROOT /usr/local/opt/go/libexec
set -x GOPATH ~/code

# fuxor git to non-interactively merge commits

set -x GIT_MERGE_AUTOEDIT no

# Set where to install casks

set -x HOMEBREW_CASK_OPTS "--appdir=/Applications"

# Setup terminal, and turn on colors

set -x TERM xterm-256color
set -xU LS_COLORS "di=34:ln=35:so=32:pi=33:ex=31:bd=34;46:cd=34:su=0:sg=0:tw=0:ow=0:"

# Enable color in grep

set -x GREP_OPTIONS '--color=auto'
set -x GREP_COLOR '3;33'

set -x LESS '--ignore-case --raw-control-chars'
set -x PAGER 'less'
set -x EDITOR 'nano'

set -x LANG en_US.UTF-8
set -x LC_CTYPE "en_US.UTF-8"
set -x LC_MESSAGES "en_US.UTF-8"
set -x LC_COLLATE C

source functions/z.fish
{{</ highlight >}}

Two notes:

- I always
  {{< highlight bash >}}
  $ brew install coreutils
  {{</ highlight >}}

and put the GNU versions of the core commands first in the path.
That's why I set the LS_COLORS environment variable, rather than the LSCOLORS that you would normally use in OSX.

- I currently hold some miscellaneous scripts in ~/bin, which I then put in my path for quick access. In the future, I will symlink those scripts to /usr/local/bin, so I won't need to add $HOME/bin in my PATH env var.

Extension and customization is achieved via a common path: functions and more elegantly, autoloading functions.

So, aliases are no more, instead you declare a function inside self contained file in ~/.config/fish/functions.

Very simple and very elegant.

These are the functions I currently have:

![My Fish functions](/img/fish-functions.jpg)

- fish_prompt.fish | customizes my prompt
- gpl.fish | prints a pretty git log
- hal.fish | ssh's to one of my servers
- l.fish | is a shortcut to ls -al --color=always
- mkd.fish | creates a dir and cd's to it
- skynet | ssh's to one of my servers
- wopr | ssh's to one of my servers
- z.fish | is fish's version of z (you can find it [here](https://github.com/roryokane/z-fish))

This is my prompt (a slightly modified clearance theme that you can find [here](https://github.com/bpinto/oh-my-fish/tree/master/themes/clearance))

{{< highlight bash >}}

# name: clearance

# ---------------

# Based on idan. Display the following bits on the left:

# - Virtualenv name (if applicable, see https://github.com/adambrenecki/virtualfish)

# - Current directory name

# - Git branch and dirty state (if inside a git repo)

function \_git_branch_name
echo (command git symbolic-ref HEAD ^/dev/null | sed -e 's|^refs/heads/||')
end

function \_git_is_dirty
echo (command git status -s --ignore-submodules=dirty ^/dev/null)
end

function \_remote_hostname
echo (whoami)@(hostname)
end

function fish_prompt
set -l cyan (set_color cyan)
set -l yellow (set_color yellow)
set -l red (set_color red)
set -l blue (set_color blue)
set -l green (set_color green)
set -l normal (set_color normal)
set -l mywhite (set_color -o white)
set -l mygreen (set_color -o green)

set -l cwd $blue(pwd | sed "s:^$HOME:~:")

set -l dove $mygreen (pwd | sed "s:^$HOME:~:")

set -l whowheredate '[' $mywhite (_remote_hostname) $normal ' ' (date "+%H:%M") '] '

# Output the prompt, left to right

# Add a newline before new prompts

echo -e ''

# User@server time

echo -n -s $whowheredate

# Print pwd or full path

echo -n -s $dove $normal

# Show git branch and status

if [ (_git_branch_name) ]
set -l git_branch (\_git_branch_name)

    if [ (_git_is_dirty) ]
      set git_info '(' $yellow $git_branch " ±" $normal ')'
    else
      set git_info '(' $green $git_branch $normal ')'
    end
    echo -n -s ' ' $git_info $normal

end

# Terminate with a nice prompt char

echo -e ''
echo -e -n -s '⟩ ' $normal
end
{{</ highlight >}}

This is gpl.fish

{{< highlight bash >}}
function gpl
git log --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
end
{{</ highlight >}}

l.fish
{{< highlight bash >}}
function l
ls -lah --color=always $argv
end
{{</ highlight >}}

## Conclusion

I'm currently using fish as my shell and it has been working great. I definitely recommend it.

I've found only one missing functionality: history sharing between sessions.

I generally have a couple tabs open, and fish doesn't share commands between tabs.

I understand it's been worked on.

**Image Source [wembley](https://unsplash.com/photos/S3Vq97p3gSk)**
