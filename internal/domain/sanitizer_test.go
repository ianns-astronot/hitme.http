package domain

import (
	"testing"
)

func TestLogSanitizer_SanitizeHeaders(t *testing.T) {
	sanitizer := NewLogSanitizer()
	
	headers := map[string]string{
		"Content-Type":  "application/json",
		"Authorization": "Bearer secret-token-12345",
		"X-API-Key":     "api-key-67890",
		"User-Agent":    "HitMe/1.0",
	}

	sanitized := sanitizer.SanitizeHeaders(headers)

	// Non-sensitive headers should remain unchanged
	if sanitized["Content-Type"] != "application/json" {
		t.Error("Content-Type should not be sanitized")
	}
	if sanitized["User-Agent"] != "HitMe/1.0" {
		t.Error("User-Agent should not be sanitized")
	}

	// Sensitive headers should be masked
	if sanitized["Authorization"] == "Bearer secret-token-12345" {
		t.Error("Authorization should be sanitized")
	}
	if sanitized["X-API-Key"] == "api-key-67890" {
		t.Error("X-API-Key should be sanitized")
	}
}

func TestLogSanitizer_SanitizeAuthConfig(t *testing.T) {
	sanitizer := NewLogSanitizer()
	
	token := "secret-token-12345"
	username := "testuser"
	password := "testpass"
	
	auth := &AuthConfig{
		Type:        "bearer",
		BearerToken: &token,
		Username:    &username,
		Password:    &password,
	}

	sanitized := sanitizer.SanitizeAuthConfig(auth)

	// Username should not be sanitized
	if sanitized.Username == nil || *sanitized.Username != "testuser" {
		t.Error("Username should not be sanitized")
	}

	// Token and password should be masked
	if sanitized.BearerToken == nil || *sanitized.BearerToken == "secret-token-12345" {
		t.Error("Bearer token should be sanitized")
	}
	if sanitized.Password == nil || *sanitized.Password == "testpass" {
		t.Error("Password should be sanitized")
	}
}

func TestLogSanitizer_SanitizeProxyConfig(t *testing.T) {
	sanitizer := NewLogSanitizer()
	
	username := "proxyuser"
	password := "proxypass"
	
	proxy := &ProxyConfig{
		ID:       "proxy1",
		Name:     "Test Proxy",
		Scheme:   "http",
		Host:     "proxy.example.com",
		Port:     8080,
		Username: &username,
		Password: &password,
	}

	sanitized := sanitizer.SanitizeProxyConfig(proxy)

	// Non-sensitive fields should remain unchanged
	if sanitized.ID != "proxy1" {
		t.Error("ID should not be sanitized")
	}
	if sanitized.Host != "proxy.example.com" {
		t.Error("Host should not be sanitized")
	}

	// Username should not be sanitized
	if sanitized.Username == nil || *sanitized.Username != "proxyuser" {
		t.Error("Username should not be sanitized")
	}

	// Password should be masked
	if sanitized.Password == nil || *sanitized.Password == "proxypass" {
		t.Error("Password should be sanitized")
	}
}

func TestLogSanitizer_Mask(t *testing.T) {
	sanitizer := NewLogSanitizer()

	tests := []struct {
		input    string
		expected string
	}{
		{"abc", "***"},
		{"12345", "12***45"},
		{"secret-token-12345", "se***45"},
	}

	for _, test := range tests {
		result := sanitizer.mask(test.input)
		if result != test.expected {
			t.Errorf("For input %s, expected %s, got %s", test.input, test.expected, result)
		}
	}
}

func TestLogSanitizer_IsSensitive(t *testing.T) {
	sanitizer := NewLogSanitizer()

	tests := []struct {
		key       string
		sensitive bool
	}{
		{"Authorization", true},
		{"X-API-Key", true},
		{"Bearer-Token", true},
		{"Password", true},
		{"Content-Type", false},
		{"User-Agent", false},
		{"Accept", false},
	}

	for _, test := range tests {
		result := sanitizer.isSensitive(test.key)
		if result != test.sensitive {
			t.Errorf("For key %s, expected %v, got %v", test.key, test.sensitive, result)
		}
	}
}
