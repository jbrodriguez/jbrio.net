package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

// Mastodon posts a status via the instance REST API.
type Mastodon struct {
	instanceURL string
	accessToken string
	http        *http.Client
}

func NewMastodon(instanceURL, accessToken string) *Mastodon {
	return &Mastodon{
		instanceURL: strings.TrimRight(instanceURL, "/"),
		accessToken: accessToken,
		http:        &http.Client{Timeout: 30 * time.Second},
	}
}

func (m *Mastodon) Post(status string) error {
	body, _ := json.Marshal(map[string]string{"status": status})
	req, _ := http.NewRequest(http.MethodPost, m.instanceURL+"/api/v1/statuses", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+m.accessToken)
	req.Header.Set("Content-Type", "application/json")
	resp, err := m.http.Do(req)
	if err != nil {
		return fmt.Errorf("post failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode/100 != 2 {
		return fmt.Errorf("post failed: %s", readErr(resp))
	}
	return nil
}
