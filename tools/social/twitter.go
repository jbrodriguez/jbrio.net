package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/dghubble/oauth1"
)

// Twitter posts a tweet via the v2 API, authenticated with OAuth 1.0a
// (HMAC-SHA1) user context, matching the old script.
type Twitter struct {
	http *http.Client
}

func NewTwitter(apiKey, apiSecret, accessToken, accessSecret string) *Twitter {
	config := oauth1.NewConfig(apiKey, apiSecret)
	token := oauth1.NewToken(accessToken, accessSecret)
	client := config.Client(oauth1.NoContext, token)
	client.Timeout = 30 * time.Second
	return &Twitter{http: client}
}

func (t *Twitter) Post(text string) error {
	body, _ := json.Marshal(map[string]string{"text": text})
	req, _ := http.NewRequest(http.MethodPost, "https://api.twitter.com/2/tweets", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := t.http.Do(req)
	if err != nil {
		return fmt.Errorf("post failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode/100 != 2 {
		return fmt.Errorf("post failed: %s", readErr(resp))
	}
	return nil
}
