package main

import (
	"strings"
	"testing"
	"unicode/utf8"
)

func TestFormatContent(t *testing.T) {
	url := "https://jbrio.net/posts/202522/"

	t.Run("includes tags that fit", func(t *testing.T) {
		fm := &Frontmatter{Description: "a pc in your browser", Tags: []string{"notes", "browser"}}
		got := formatContent(fm, url, limitBluesky)
		want := "a pc in your browser\n\n#notes #browser\n\n" + url
		if got != want {
			t.Fatalf("got %q, want %q", got, want)
		}
	})

	t.Run("falls back to title when no description", func(t *testing.T) {
		fm := &Frontmatter{Title: "My Title"}
		got := formatContent(fm, url, limitBluesky)
		if !strings.HasPrefix(got, "My Title\n\n") {
			t.Fatalf("expected title prefix, got %q", got)
		}
	})

	t.Run("drops tags that do not fit", func(t *testing.T) {
		fm := &Frontmatter{
			Description: strings.Repeat("x", 250),
			Tags:        []string{"toolongtagwontfit"},
		}
		got := formatContent(fm, url, limitTwitter)
		if strings.Contains(got, "#toolongtagwontfit") {
			t.Fatalf("tag should have been dropped: %q", got)
		}
	})

	t.Run("truncates over-limit description", func(t *testing.T) {
		fm := &Frontmatter{Description: strings.Repeat("x", 400)}
		got := formatContent(fm, url, limitTwitter)
		if utf8.RuneCountInString(got) > limitTwitter {
			t.Fatalf("result %d runes exceeds limit %d", utf8.RuneCountInString(got), limitTwitter)
		}
		if !strings.Contains(got, "...") || !strings.HasSuffix(got, url) {
			t.Fatalf("expected truncation marker and url suffix, got %q", got)
		}
	})
}

func TestSlugFromPath(t *testing.T) {
	if got := slugFromPath("data/posts/202545/index.md"); got != "202545" {
		t.Fatalf("got %q, want 202545", got)
	}
}
