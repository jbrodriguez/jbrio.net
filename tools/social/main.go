// Command social posts newly-published blog posts to social media.
//
// Usage:
//
//	social "data/posts/202545/index.md\ndata/posts/202546/index.md"
//
// It is a faithful Go port of the old scripts/post-to-social.js: for each new
// markdown post it parses the frontmatter, skips drafts and posts without a
// description, formats a per-platform message (description + hashtags + URL,
// truncated to each platform's limit), and posts to Bluesky, Mastodon, and X.
// Each network is attempted only when its credentials are present in the
// environment; a failure on one network never aborts the others.
package main

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"gopkg.in/yaml.v3"
)

// platform character limits (matching the old script).
const (
	limitBluesky  = 300
	limitMastodon = 500
	limitTwitter  = 280
)

// Frontmatter holds the post fields the poster cares about.
type Frontmatter struct {
	Title       string   `yaml:"title"`
	Description string   `yaml:"description"`
	Tags        []string `yaml:"tags"`
	Cover       string   `yaml:"cover"`
	Status      string   `yaml:"status"`
}

var frontmatterRe = regexp.MustCompile(`(?s)^---\n(.*?)\n---`)

func parseFrontmatter(path string) (*Frontmatter, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	m := frontmatterRe.FindSubmatch(raw)
	if m == nil {
		return nil, fmt.Errorf("no frontmatter found in %s", path)
	}
	var fm Frontmatter
	if err := yaml.Unmarshal(m[1], &fm); err != nil {
		return nil, fmt.Errorf("parse %s: %w", path, err)
	}
	return &fm, nil
}

// slugFromPath returns the post directory name, e.g.
// "data/posts/202545/index.md" -> "202545".
func slugFromPath(path string) string {
	return filepath.Base(filepath.Dir(path))
}

// formatContent builds the post body for a platform: description, the tags
// that fit, and the URL, truncating the description if the whole thing still
// exceeds the limit.
func formatContent(fm *Frontmatter, postURL string, limit int) string {
	desc := fm.Description
	if desc == "" {
		desc = fm.Title
	}

	base := desc + "\n\n" + postURL
	remaining := limit - utf8.RuneCountInString(base) - 1

	var selected []string
	for _, tag := range fm.Tags {
		t := " #" + tag
		if remaining >= utf8.RuneCountInString(t) {
			selected = append(selected, tag)
			remaining -= utf8.RuneCountInString(t)
		} else {
			break
		}
	}

	var final string
	if len(selected) > 0 {
		hashtags := "#" + strings.Join(selected, " #")
		final = desc + "\n\n" + hashtags + "\n\n" + postURL
	} else {
		final = desc + "\n\n" + postURL
	}

	if utf8.RuneCountInString(final) > limit {
		cut := limit - utf8.RuneCountInString(postURL) - 5
		if cut < 0 {
			cut = 0
		}
		truncated := truncateRunes(desc, cut) + "..."
		final = truncated + "\n\n" + postURL
	}
	return final
}

func truncateRunes(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:n])
}

// FallbackEmbed is the cover/title/description used for the Bluesky embed card
// when the live page's Open Graph tags can't be fetched.
type FallbackEmbed struct {
	Title       string
	Description string
	ImageURL    string // remote cover
	ImagePath   string // local cover file
}

func buildFallbackEmbed(fm *Frontmatter, postPath string) FallbackEmbed {
	fb := FallbackEmbed{
		Title:       firstNonEmpty(fm.Title, fm.Description),
		Description: fm.Description,
	}
	if fm.Cover == "" {
		return fb
	}
	if strings.HasPrefix(fm.Cover, "http://") || strings.HasPrefix(fm.Cover, "https://") {
		fb.ImageURL = fm.Cover
		return fb
	}
	abs := filepath.Join(filepath.Dir(postPath), fm.Cover)
	if _, err := os.Stat(abs); err == nil {
		fb.ImagePath = abs
	}
	return fb
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if v != "" {
			return v
		}
	}
	return ""
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("No new files provided")
		return
	}
	// Args may arrive as one newline-separated string or several args.
	files := strings.Fields(strings.Join(os.Args[1:], "\n"))
	if len(files) == 0 {
		fmt.Println("No new files provided")
		return
	}
	fmt.Println("Processing new files:", files)

	siteURL := envOr("SITE_URL", "https://jbrio.net")
	delayMS, _ := strconv.Atoi(envOr("DEPLOYMENT_DELAY_MS", "60000"))
	if delayMS > 0 {
		fmt.Printf("\n⏳ Waiting %d seconds for deployment to complete...\n", delayMS/1000)
		time.Sleep(time.Duration(delayMS) * time.Millisecond)
		fmt.Println("✅ Deployment wait completed")
	}

	for _, path := range files {
		if !strings.HasSuffix(path, ".md") || !strings.Contains(path, "/posts/") {
			fmt.Printf("Skipping non-post file: %s\n", path)
			continue
		}
		fm, err := parseFrontmatter(path)
		if err != nil {
			fmt.Printf("Skipping %s: %v\n", path, err)
			continue
		}
		if fm.Status != "published" {
			fmt.Printf("Skipping unpublished post: %s (status: %s)\n", path, fm.Status)
			continue
		}
		if fm.Description == "" {
			fmt.Printf("Skipping post with no description: %s\n", path)
			continue
		}

		slug := slugFromPath(path)
		postURL := strings.TrimRight(siteURL, "/") + "/posts/" + slug + "/"

		fmt.Printf("\n📝 Processing post: %s\n", fm.Title)
		fmt.Printf("   Description: %s\n", fm.Description)
		fmt.Printf("   URL: %s\n", postURL)
		fmt.Printf("   Tags: %s\n", orNone(strings.Join(fm.Tags, ", ")))

		postAll(fm, postURL, path)
	}
}

// postAll attempts each network gated on its credentials and prints a summary.
func postAll(fm *Frontmatter, postURL, postPath string) {
	type result struct {
		name string
		err  error
		ran  bool
	}
	var results []result

	// Bluesky
	if id, pw := os.Getenv("BLUESKY_IDENTIFIER"), os.Getenv("BLUESKY_PASSWORD"); id != "" && pw != "" {
		content := formatContent(fm, postURL, limitBluesky)
		fmt.Println("Posting to BlueSky:", content)
		err := NewBsky(id, pw).Post(content, buildFallbackEmbed(fm, postPath))
		results = append(results, result{"bluesky", err, true})
		logResult("BlueSky", err)
	}

	// Mastodon
	if url, tok := os.Getenv("MASTODON_INSTANCE_URL"), os.Getenv("MASTODON_ACCESS_TOKEN"); url != "" && tok != "" {
		content := formatContent(fm, postURL, limitMastodon)
		fmt.Println("Posting to Mastodon:", content)
		err := NewMastodon(url, tok).Post(content)
		results = append(results, result{"mastodon", err, true})
		logResult("Mastodon", err)
	}

	// Twitter / X
	if k, s := os.Getenv("TWITTER_API_KEY"), os.Getenv("TWITTER_API_SECRET"); k != "" && s != "" &&
		os.Getenv("TWITTER_ACCESS_TOKEN") != "" && os.Getenv("TWITTER_ACCESS_SECRET") != "" {
		content := formatContent(fm, postURL, limitTwitter)
		fmt.Println("Posting to Twitter:", content)
		err := NewTwitter(k, s, os.Getenv("TWITTER_ACCESS_TOKEN"), os.Getenv("TWITTER_ACCESS_SECRET")).Post(content)
		results = append(results, result{"twitter", err, true})
		logResult("Twitter", err)
	}

	ok := 0
	for _, r := range results {
		if r.ran && r.err == nil {
			ok++
		}
	}
	fmt.Printf("\n📊 Summary: %d/%d platforms posted successfully\n", ok, len(results))
	for _, r := range results {
		if r.err != nil {
			fmt.Printf("   %s: %v\n", r.name, r.err)
		}
	}
}

func logResult(name string, err error) {
	if err != nil {
		fmt.Printf("❌ %s post failed: %v\n", name, err)
		return
	}
	fmt.Printf("✅ %s post successful\n", name)
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func orNone(s string) string {
	if s == "" {
		return "none"
	}
	return s
}
