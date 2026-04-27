package service

import (
	"encoding/base64"
	"testing"

	"hitme-http/internal/domain"
)

func TestAuthBuilder_BuildHeaders_Bearer(t *testing.T) {
	builder := NewAuthBuilder()
	token := "test-token-123"
	authConfig := &domain.AuthConfig{
		Type:        "bearer",
		BearerToken: &token,
	}

	headers, err := builder.BuildHeaders(authConfig, map[string]string{})
	if err != nil {
		t.Fatalf("Failed to build headers: %v", err)
	}

	expected := "Bearer test-token-123"
	if headers["Authorization"] != expected {
		t.Errorf("Expected %s, got %s", expected, headers["Authorization"])
	}
}

func TestAuthBuilder_BuildHeaders_Basic(t *testing.T) {
	builder := NewAuthBuilder()
	username := "testuser"
	password := "testpass"
	authConfig := &domain.AuthConfig{
		Type:     "basic",
		Username: &username,
		Password: &password,
	}

	headers, err := builder.BuildHeaders(authConfig, map[string]string{})
	if err != nil {
		t.Fatalf("Failed to build headers: %v", err)
	}

	expectedCreds := base64.StdEncoding.EncodeToString([]byte("testuser:testpass"))
	expected := "Basic " + expectedCreds
	if headers["Authorization"] != expected {
		t.Errorf("Expected %s, got %s", expected, headers["Authorization"])
	}
}

func TestAuthBuilder_BuildHeaders_APIKeyHeader(t *testing.T) {
	builder := NewAuthBuilder()
	apiKey := "test-api-key"
	apiKeyName := "X-API-Key"
	apiKeyLocation := "header"
	authConfig := &domain.AuthConfig{
		Type:           "apikey",
		APIKey:         &apiKey,
		APIKeyName:     &apiKeyName,
		APIKeyLocation: &apiKeyLocation,
	}

	headers, err := builder.BuildHeaders(authConfig, map[string]string{})
	if err != nil {
		t.Fatalf("Failed to build headers: %v", err)
	}

	if headers["X-API-Key"] != "test-api-key" {
		t.Errorf("Expected test-api-key, got %s", headers["X-API-Key"])
	}
}

func TestAuthBuilder_BuildQueryParams_APIKeyQuery(t *testing.T) {
	builder := NewAuthBuilder()
	apiKey := "test-api-key"
	apiKeyName := "api_key"
	apiKeyLocation := "query"
	authConfig := &domain.AuthConfig{
		Type:           "apikey",
		APIKey:         &apiKey,
		APIKeyName:     &apiKeyName,
		APIKeyLocation: &apiKeyLocation,
	}

	params, err := builder.BuildQueryParams(authConfig, map[string]string{})
	if err != nil {
		t.Fatalf("Failed to build query params: %v", err)
	}

	if params["api_key"] != "test-api-key" {
		t.Errorf("Expected test-api-key, got %s", params["api_key"])
	}
}

func TestAuthBuilder_BuildHeaders_WithVariables(t *testing.T) {
	builder := NewAuthBuilder()
	token := "{{token}}"
	authConfig := &domain.AuthConfig{
		Type:        "bearer",
		BearerToken: &token,
	}
	variables := map[string]string{
		"token": "resolved-token-123",
	}

	headers, err := builder.BuildHeaders(authConfig, variables)
	if err != nil {
		t.Fatalf("Failed to build headers: %v", err)
	}

	expected := "Bearer resolved-token-123"
	if headers["Authorization"] != expected {
		t.Errorf("Expected %s, got %s", expected, headers["Authorization"])
	}
}

func TestAuthBuilder_BuildHeaders_None(t *testing.T) {
	builder := NewAuthBuilder()
	authConfig := &domain.AuthConfig{
		Type: "none",
	}

	headers, err := builder.BuildHeaders(authConfig, map[string]string{})
	if err != nil {
		t.Fatalf("Failed to build headers: %v", err)
	}

	if len(headers) != 0 {
		t.Errorf("Expected empty headers, got %d", len(headers))
	}
}

func TestAuthBuilder_BuildHeaders_MissingToken(t *testing.T) {
	builder := NewAuthBuilder()
	authConfig := &domain.AuthConfig{
		Type: "bearer",
	}

	_, err := builder.BuildHeaders(authConfig, map[string]string{})
	if err == nil {
		t.Error("Expected error for missing bearer token")
	}
}

func TestAuthBuilder_BuildHeaders_MissingCredentials(t *testing.T) {
	builder := NewAuthBuilder()
	authConfig := &domain.AuthConfig{
		Type: "basic",
	}

	_, err := builder.BuildHeaders(authConfig, map[string]string{})
	if err == nil {
		t.Error("Expected error for missing credentials")
	}
}
