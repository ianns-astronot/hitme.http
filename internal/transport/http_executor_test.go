package transport

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"hitme-http/internal/domain"
)

func TestHTTPExecutor_Execute_GET(t *testing.T) {
	// Create test server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			t.Errorf("Expected GET, got %s", r.Method)
		}
		if r.URL.Query().Get("page") != "1" {
			t.Errorf("Expected page=1, got %s", r.URL.Query().Get("page"))
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	}))
	defer server.Close()

	executor := NewHTTPExecutor()
	request := &domain.RequestNode{
		Method: "GET",
		URL:    server.URL,
		QueryParams: []*domain.KeyValueItem{
			{Key: "page", Value: "1", Enabled: true},
		},
		Headers: []*domain.KeyValueItem{
			{Key: "User-Agent", Value: "HitMe-Test", Enabled: true},
		},
		Body: &domain.BodyConfig{Type: "none"},
	}

	result, err := executor.Execute(request)
	if err != nil {
		t.Fatalf("Failed to execute request: %v", err)
	}

	if result.StatusCode != 200 {
		t.Errorf("Expected status 200, got %d", result.StatusCode)
	}
	if result.ResponseTime <= 0 {
		t.Error("Expected positive response time")
	}
	if result.ResponseSize <= 0 {
		t.Error("Expected positive response size")
	}
}

func TestHTTPExecutor_Execute_POST_JSON(t *testing.T) {
	// Create test server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("Expected POST, got %s", r.Method)
		}
		if r.Header.Get("Content-Type") != "application/json" {
			t.Errorf("Expected Content-Type application/json, got %s", r.Header.Get("Content-Type"))
		}

		var body map[string]interface{}
		json.NewDecoder(r.Body).Decode(&body)
		if body["name"] != "test" {
			t.Errorf("Expected name=test, got %v", body["name"])
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"id": "123"})
	}))
	defer server.Close()

	executor := NewHTTPExecutor()
	request := &domain.RequestNode{
		Method: "POST",
		URL:    server.URL,
		Headers: []*domain.KeyValueItem{
			{Key: "Content-Type", Value: "application/json", Enabled: true},
		},
		Body: &domain.BodyConfig{
			Type:    "json",
			Content: `{"name":"test"}`,
		},
	}

	result, err := executor.Execute(request)
	if err != nil {
		t.Fatalf("Failed to execute request: %v", err)
	}

	if result.StatusCode != 201 {
		t.Errorf("Expected status 201, got %d", result.StatusCode)
	}
}

func TestHTTPExecutor_Execute_POST_FormURLEncoded(t *testing.T) {
	// Create test server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("Expected POST, got %s", r.Method)
		}

		r.ParseForm()
		if r.FormValue("username") != "testuser" {
			t.Errorf("Expected username=testuser, got %s", r.FormValue("username"))
		}

		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	executor := NewHTTPExecutor()
	request := &domain.RequestNode{
		Method: "POST",
		URL:    server.URL,
		Body: &domain.BodyConfig{
			Type: "form-urlencoded",
			FormData: []*domain.KeyValueItem{
				{Key: "username", Value: "testuser", Enabled: true},
				{Key: "password", Value: "pass123", Enabled: true},
			},
		},
	}

	result, err := executor.Execute(request)
	if err != nil {
		t.Fatalf("Failed to execute request: %v", err)
	}

	if result.StatusCode != 200 {
		t.Errorf("Expected status 200, got %d", result.StatusCode)
	}
}

func TestHTTPExecutor_Execute_InvalidJSON(t *testing.T) {
	executor := NewHTTPExecutor()
	request := &domain.RequestNode{
		Method: "POST",
		URL:    "http://example.com",
		Body: &domain.BodyConfig{
			Type:    "json",
			Content: `{invalid json}`,
		},
	}

	_, err := executor.Execute(request)
	if err == nil {
		t.Error("Expected error for invalid JSON")
	}
}

func TestHTTPExecutor_Execute_DisabledParams(t *testing.T) {
	// Create test server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Should only have enabled param
		if r.URL.Query().Get("disabled") != "" {
			t.Error("Disabled param should not be sent")
		}
		if r.URL.Query().Get("enabled") != "yes" {
			t.Error("Enabled param should be sent")
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	executor := NewHTTPExecutor()
	request := &domain.RequestNode{
		Method: "GET",
		URL:    server.URL,
		QueryParams: []*domain.KeyValueItem{
			{Key: "enabled", Value: "yes", Enabled: true},
			{Key: "disabled", Value: "no", Enabled: false},
		},
	}

	executor.Execute(request)
}

func TestHTTPExecutor_Execute_DisabledHeaders(t *testing.T) {
	// Create test server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("X-Disabled") != "" {
			t.Error("Disabled header should not be sent")
		}
		if r.Header.Get("X-Enabled") != "yes" {
			t.Error("Enabled header should be sent")
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	executor := NewHTTPExecutor()
	request := &domain.RequestNode{
		Method: "GET",
		URL:    server.URL,
		Headers: []*domain.KeyValueItem{
			{Key: "X-Enabled", Value: "yes", Enabled: true},
			{Key: "X-Disabled", Value: "no", Enabled: false},
		},
	}

	executor.Execute(request)
}

func TestHTTPExecutor_Execute_NetworkError(t *testing.T) {
	executor := NewHTTPExecutor()
	request := &domain.RequestNode{
		Method: "GET",
		URL:    "http://invalid-domain-that-does-not-exist-12345.com",
		Body:   &domain.BodyConfig{Type: "none"},
	}

	result, err := executor.Execute(request)
	if err == nil {
		t.Error("Expected network error")
	}
	if result == nil {
		t.Error("Expected result even on error")
	}
	if result.Error == nil {
		t.Error("Expected error field to be set")
	}
}
