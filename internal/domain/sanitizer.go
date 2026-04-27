package domain

import (
	"fmt"
	"strings"
)

// LogSanitizer sanitizes sensitive data from logs
type LogSanitizer struct {
	sensitiveKeys []string
}

// NewLogSanitizer creates a new log sanitizer
func NewLogSanitizer() *LogSanitizer {
	return &LogSanitizer{
		sensitiveKeys: []string{
			"authorization",
			"password",
			"token",
			"api-key",
			"api_key",
			"apikey",
			"secret",
			"bearer",
		},
	}
}

// SanitizeHeaders sanitizes sensitive headers
func (s *LogSanitizer) SanitizeHeaders(headers map[string]string) map[string]string {
	sanitized := make(map[string]string)
	for key, value := range headers {
		if s.isSensitive(key) {
			sanitized[key] = s.mask(value)
		} else {
			sanitized[key] = value
		}
	}
	return sanitized
}

// SanitizeAuthConfig sanitizes auth configuration for logging
func (s *LogSanitizer) SanitizeAuthConfig(auth *AuthConfig) *AuthConfig {
	if auth == nil {
		return nil
	}

	sanitized := &AuthConfig{
		Type:           auth.Type,
		APIKeyLocation: auth.APIKeyLocation,
		APIKeyName:     auth.APIKeyName,
	}

	if auth.BearerToken != nil {
		masked := s.mask(*auth.BearerToken)
		sanitized.BearerToken = &masked
	}
	if auth.Username != nil {
		sanitized.Username = auth.Username // Username is not sensitive
	}
	if auth.Password != nil {
		masked := s.mask(*auth.Password)
		sanitized.Password = &masked
	}
	if auth.APIKey != nil {
		masked := s.mask(*auth.APIKey)
		sanitized.APIKey = &masked
	}

	return sanitized
}

// SanitizeProxyConfig sanitizes proxy configuration for logging
func (s *LogSanitizer) SanitizeProxyConfig(proxy *ProxyConfig) *ProxyConfig {
	if proxy == nil {
		return nil
	}

	sanitized := &ProxyConfig{
		ID:     proxy.ID,
		Name:   proxy.Name,
		Scheme: proxy.Scheme,
		Host:   proxy.Host,
		Port:   proxy.Port,
	}

	if proxy.Username != nil {
		sanitized.Username = proxy.Username // Username is not sensitive
	}
	if proxy.Password != nil {
		masked := s.mask(*proxy.Password)
		sanitized.Password = &masked
	}

	return sanitized
}

// isSensitive checks if a key is sensitive
func (s *LogSanitizer) isSensitive(key string) bool {
	lowerKey := strings.ToLower(key)
	for _, sensitive := range s.sensitiveKeys {
		if strings.Contains(lowerKey, sensitive) {
			return true
		}
	}
	return false
}

// mask masks a sensitive value
func (s *LogSanitizer) mask(value string) string {
	if len(value) <= 4 {
		return "***"
	}
	// Show first 2 and last 2 characters
	return fmt.Sprintf("%s***%s", value[:2], value[len(value)-2:])
}
