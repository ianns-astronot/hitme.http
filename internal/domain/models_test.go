package domain

import (
	"encoding/json"
	"testing"
	"time"
)

func TestCollectionMarshaling(t *testing.T) {
	now := time.Now()
	collection := &Collection{
		ID:            "test-id",
		Name:          "Test Collection",
		Variables:     map[string]string{"baseUrl": "https://api.example.com"},
		GlobalAuth:    &AuthConfig{Type: "bearer", BearerToken: strPtr("test-token")},
		Proxies:       []*ProxyConfig{},
		ActiveProxyID: nil,
		Requests:      []*RequestNode{},
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	// Marshal
	data, err := json.Marshal(collection)
	if err != nil {
		t.Fatalf("Failed to marshal collection: %v", err)
	}

	// Unmarshal
	var unmarshaled Collection
	if err := json.Unmarshal(data, &unmarshaled); err != nil {
		t.Fatalf("Failed to unmarshal collection: %v", err)
	}

	// Verify
	if unmarshaled.ID != collection.ID {
		t.Errorf("Expected ID %s, got %s", collection.ID, unmarshaled.ID)
	}
	if unmarshaled.Name != collection.Name {
		t.Errorf("Expected Name %s, got %s", collection.Name, unmarshaled.Name)
	}
	if unmarshaled.Variables["baseUrl"] != collection.Variables["baseUrl"] {
		t.Errorf("Expected baseUrl %s, got %s", collection.Variables["baseUrl"], unmarshaled.Variables["baseUrl"])
	}
}

func TestRequestNodeMarshaling(t *testing.T) {
	now := time.Now()
	request := &RequestNode{
		ID:           "req-id",
		CollectionID: "coll-id",
		Name:         "Get Users",
		Method:       "GET",
		URL:          "{{baseUrl}}/users",
		QueryParams: []*KeyValueItem{
			{Key: "page", Value: "1", Enabled: true},
		},
		Headers: []*KeyValueItem{
			{Key: "Content-Type", Value: "application/json", Enabled: true},
		},
		Body: &BodyConfig{
			Type:    "none",
			Content: "",
		},
		AuthOverride:    nil,
		ProxyOverrideID: nil,
		LastRun:         nil,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	// Marshal
	data, err := json.Marshal(request)
	if err != nil {
		t.Fatalf("Failed to marshal request: %v", err)
	}

	// Unmarshal
	var unmarshaled RequestNode
	if err := json.Unmarshal(data, &unmarshaled); err != nil {
		t.Fatalf("Failed to unmarshal request: %v", err)
	}

	// Verify
	if unmarshaled.ID != request.ID {
		t.Errorf("Expected ID %s, got %s", request.ID, unmarshaled.ID)
	}
	if unmarshaled.Method != request.Method {
		t.Errorf("Expected Method %s, got %s", request.Method, unmarshaled.Method)
	}
	if len(unmarshaled.QueryParams) != len(request.QueryParams) {
		t.Errorf("Expected %d query params, got %d", len(request.QueryParams), len(unmarshaled.QueryParams))
	}
}

func TestAuthConfigTypes(t *testing.T) {
	tests := []struct {
		name   string
		config *AuthConfig
	}{
		{
			name:   "None",
			config: &AuthConfig{Type: "none"},
		},
		{
			name:   "Bearer",
			config: &AuthConfig{Type: "bearer", BearerToken: strPtr("token123")},
		},
		{
			name:   "Basic",
			config: &AuthConfig{Type: "basic", Username: strPtr("user"), Password: strPtr("pass")},
		},
		{
			name:   "API Key Header",
			config: &AuthConfig{Type: "apikey", APIKey: strPtr("key123"), APIKeyLocation: strPtr("header"), APIKeyName: strPtr("X-API-Key")},
		},
		{
			name:   "API Key Query",
			config: &AuthConfig{Type: "apikey", APIKey: strPtr("key123"), APIKeyLocation: strPtr("query"), APIKeyName: strPtr("api_key")},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			data, err := json.Marshal(tt.config)
			if err != nil {
				t.Fatalf("Failed to marshal auth config: %v", err)
			}

			var unmarshaled AuthConfig
			if err := json.Unmarshal(data, &unmarshaled); err != nil {
				t.Fatalf("Failed to unmarshal auth config: %v", err)
			}

			if unmarshaled.Type != tt.config.Type {
				t.Errorf("Expected Type %s, got %s", tt.config.Type, unmarshaled.Type)
			}
		})
	}
}

func strPtr(s string) *string {
	return &s
}
