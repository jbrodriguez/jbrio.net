package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

const (
	bskyService = "https://bsky.social"
	modernUA    = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
)

var imageMIME = map[string]string{
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".png":  "image/png",
	".gif":  "image/gif",
	".webp": "image/webp",
}

// Bsky posts to Bluesky via the atproto XRPC HTTP API.
type Bsky struct {
	identifier string
	password   string
	http       *http.Client

	accessJWT string
	did       string
}

func NewBsky(identifier, password string) *Bsky {
	return &Bsky{
		identifier: identifier,
		password:   password,
		http:       &http.Client{Timeout: 30 * time.Second},
	}
}

func (b *Bsky) login() error {
	body, _ := json.Marshal(map[string]string{
		"identifier": b.identifier,
		"password":   b.password,
	})
	req, _ := http.NewRequest(http.MethodPost, bskyService+"/xrpc/com.atproto.server.createSession", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := b.http.Do(req)
	if err != nil {
		return fmt.Errorf("authentication fail: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode/100 != 2 {
		return fmt.Errorf("authentication fail: %s", readErr(resp))
	}
	var out struct {
		AccessJWT string `json:"accessJwt"`
		DID       string `json:"did"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return fmt.Errorf("authentication fail: %w", err)
	}
	b.accessJWT, b.did = out.AccessJWT, out.DID
	return nil
}

// uploadBlob uploads raw image bytes and returns the blob object (the value of
// the response's "blob" field), ready to be embedded as a record thumb.
func (b *Bsky) uploadBlob(data []byte, mime string) (json.RawMessage, error) {
	req, _ := http.NewRequest(http.MethodPost, bskyService+"/xrpc/com.atproto.repo.uploadBlob", bytes.NewReader(data))
	req.Header.Set("Content-Type", mime)
	req.Header.Set("Authorization", "Bearer "+b.accessJWT)
	resp, err := b.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode/100 != 2 {
		return nil, fmt.Errorf("uploadBlob: %s", readErr(resp))
	}
	var out struct {
		Blob json.RawMessage `json:"blob"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return out.Blob, nil
}

func (b *Bsky) uploadBlobFromURL(url string) (json.RawMessage, error) {
	req, _ := http.NewRequest(http.MethodGet, url, nil)
	req.Header.Set("User-Agent", modernUA)
	resp, err := b.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode/100 != 2 {
		return nil, fmt.Errorf("fetch image %s: status %d", url, resp.StatusCode)
	}
	data, err := io.ReadAll(io.LimitReader(resp.Body, 5<<20))
	if err != nil {
		return nil, err
	}
	mime := resp.Header.Get("Content-Type")
	if mime == "" {
		mime = "image/jpeg"
	}
	return b.uploadBlob(data, mime)
}

func (b *Bsky) uploadBlobFromFile(path string) (json.RawMessage, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	mime := imageMIME[strings.ToLower(filepath.Ext(path))]
	if mime == "" {
		mime = "image/jpeg"
	}
	return b.uploadBlob(data, mime)
}

var urlRe = regexp.MustCompile(`https?://[^\s]+`)

// Post creates a Bluesky post with clickable link facets and, when possible,
// an external embed card for the first URL. Embed failures degrade to a
// text-only post, matching the old script.
func (b *Bsky) Post(text string, fb FallbackEmbed) error {
	if err := b.login(); err != nil {
		return err
	}

	record := map[string]any{
		"$type":     "app.bsky.feed.post",
		"text":      text,
		"createdAt": time.Now().UTC().Format(time.RFC3339),
	}

	// Link facets (byte offsets into the UTF-8 text).
	var facets []map[string]any
	var embedURL string
	for _, loc := range urlRe.FindAllStringIndex(text, -1) {
		url := text[loc[0]:loc[1]]
		if embedURL == "" {
			embedURL = url
		}
		facets = append(facets, map[string]any{
			"index": map[string]any{
				"byteStart": loc[0],
				"byteEnd":   loc[1],
			},
			"features": []map[string]any{{
				"$type": "app.bsky.richtext.facet#link",
				"uri":   url,
			}},
		})
	}
	if len(facets) > 0 {
		record["facets"] = facets
	}

	if embedURL != "" {
		if embed := b.buildExternalEmbed(embedURL, fb); embed != nil {
			record["embed"] = embed
		}
	}

	body, _ := json.Marshal(map[string]any{
		"repo":       b.did,
		"collection": "app.bsky.feed.post",
		"record":     record,
	})
	req, _ := http.NewRequest(http.MethodPost, bskyService+"/xrpc/com.atproto.repo.createRecord", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+b.accessJWT)
	resp, err := b.http.Do(req)
	if err != nil {
		return fmt.Errorf("post failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode/100 != 2 {
		return fmt.Errorf("post failed: %s", readErr(resp))
	}
	return nil
}

// buildExternalEmbed fetches Open Graph metadata for the URL (falling back to
// frontmatter), uploads a thumbnail when available, and returns the embed
// object, or nil if no usable metadata exists.
func (b *Bsky) buildExternalEmbed(url string, fb FallbackEmbed) map[string]any {
	meta := b.fetchOG(url)
	if meta == nil || meta.title == "" {
		if fb.Title == "" {
			return nil
		}
		meta = &ogMeta{title: firstNonEmpty(fb.Title, fb.Description, url), description: fb.Description}
	}

	external := map[string]any{
		"uri":         url,
		"title":       meta.title,
		"description": meta.description,
	}

	var thumb json.RawMessage
	var err error
	switch {
	case meta.imageURL != "":
		thumb, err = b.uploadBlobFromURL(meta.imageURL)
	case fb.ImageURL != "":
		thumb, err = b.uploadBlobFromURL(fb.ImageURL)
	case fb.ImagePath != "":
		thumb, err = b.uploadBlobFromFile(fb.ImagePath)
	}
	if err != nil {
		fmt.Printf("⚠️  embed thumbnail upload failed: %v\n", err)
	}
	if len(thumb) > 0 {
		external["thumb"] = thumb
	}

	return map[string]any{
		"$type":    "app.bsky.embed.external",
		"external": external,
	}
}

type ogMeta struct {
	title       string
	description string
	imageURL    string
}

var (
	ogTitleRe = regexp.MustCompile(`(?i)<meta\s+(?:property="og:title"\s+content="([^"]+)"|content="([^"]+)"\s+property="og:title")`)
	htmlTitle = regexp.MustCompile(`(?i)<title>([^<]+)</title>`)
	ogDescRe  = regexp.MustCompile(`(?i)<meta\s+(?:property="og:description"\s+content="([^"]+)"|content="([^"]+)"\s+property="og:description")`)
	metaDesc  = regexp.MustCompile(`(?i)<meta\s+name="description"\s+content="([^"]+)"`)
	ogImageRe = regexp.MustCompile(`(?i)<meta\s+(?:property="og:image"\s+content="([^"]+)"|content="([^"]+)"\s+property="og:image")`)
)

func (b *Bsky) fetchOG(url string) *ogMeta {
	req, _ := http.NewRequest(http.MethodGet, url, nil)
	req.Header.Set("User-Agent", modernUA)
	resp, err := b.http.Do(req)
	if err != nil {
		fmt.Printf("⚠️  failed to fetch metadata for %s: %v\n", url, err)
		return nil
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil
	}
	html := string(data)
	return &ogMeta{
		title:       firstNonEmpty(firstGroup(ogTitleRe, html), firstGroup(htmlTitle, html)),
		description: firstNonEmpty(firstGroup(ogDescRe, html), firstGroup(metaDesc, html)),
		imageURL:    firstGroup(ogImageRe, html),
	}
}

// firstGroup returns the first non-empty capture group of the first match.
func firstGroup(re *regexp.Regexp, s string) string {
	m := re.FindStringSubmatch(s)
	if m == nil {
		return ""
	}
	for _, g := range m[1:] {
		if g != "" {
			return g
		}
	}
	return ""
}

func readErr(resp *http.Response) string {
	data, _ := io.ReadAll(io.LimitReader(resp.Body, 4<<10))
	msg := strings.TrimSpace(string(data))
	if msg == "" {
		return resp.Status
	}
	return fmt.Sprintf("%s: %s", resp.Status, msg)
}
