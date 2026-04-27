package service

import (
	"encoding/base64"
	"fmt"

	"hitme-http/internal/domain"
)

// AuthBuilder builds authentication headers and query params
type AuthBuilder struct {
	resolver *VariableResolver
}

// NewAuthBuilder creates a new auth builder
func NewAuthBuilder() *AuthBuilder {
	return &AuthBuilder{
		resolver: NewVariableResolver(),
	}
}

// BuildHeaders builds authentication headers
func (b *AuthBuilder) BuildHeaders(authConfig *domain.AuthConfig, variables map[string]string) (map[string]string, error) {
	if authConfig == nil || authConfig.Type == "none" {
		return make(map[string]string), nil
	}

	headers := make(map[string]string)

	switch authConfig.Type {
	case "bearer":
		if authConfig.BearerToken == nil {
			return nil, domain.NewValidationError("bearer token is required", nil)
		}
		token, err := b.resolver.Resolve(*authConfig.BearerToken, variables)
		if err != nil {
			return nil, fmt.Errorf("failed to resolve bearer token: %w", err)
		}
		headers["Authorization"] = fmt.Sprintf("Bearer %s", token)

	case "basic":
		if authConfig.Username == nil || authConfig.Password == nil {
			return nil, domain.NewValidationError("username and password are required for basic auth", nil)
		}
		username, err := b.resolver.Resolve(*authConfig.Username, variables)
		if err != nil {
			return nil, fmt.Errorf("failed to resolve username: %w", err)
		}
		password, err := b.resolver.Resolve(*authConfig.Password, variables)
		if err != nil {
			return nil, fmt.Errorf("failed to resolve password: %w", err)
		}
		credentials := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%s:%s", username, password)))
		headers["Authorization"] = fmt.Sprintf("Basic %s", credentials)

	case "apikey":
		if authConfig.APIKey == nil || authConfig.APIKeyName == nil || authConfig.APIKeyLocation == nil {
			return nil, domain.NewValidationError("API key, name, and location are required", nil)
		}
		if *authConfig.APIKeyLocation == "header" {
			key, err := b.resolver.Resolve(*authConfig.APIKey, variables)
			if err != nil {
				return nil, fmt.Errorf("failed to resolve API key: %w", err)
			}
			keyName, err := b.resolver.Resolve(*authConfig.APIKeyName, variables)
			if err != nil {
				return nil, fmt.Errorf("failed to resolve API key name: %w", err)
			}
			headers[keyName] = key
		}

	default:
		return nil, domain.NewValidationError(fmt.Sprintf("unsupported auth type: %s", authConfig.Type), nil)
	}

	return headers, nil
}

// BuildQueryParams builds authentication query parameters
func (b *AuthBuilder) BuildQueryParams(authConfig *domain.AuthConfig, variables map[string]string) (map[string]string, error) {
	if authConfig == nil || authConfig.Type == "none" {
		return make(map[string]string), nil
	}

	params := make(map[string]string)

	if authConfig.Type == "apikey" {
		if authConfig.APIKey == nil || authConfig.APIKeyName == nil || authConfig.APIKeyLocation == nil {
			return nil, domain.NewValidationError("API key, name, and location are required", nil)
		}
		if *authConfig.APIKeyLocation == "query" {
			key, err := b.resolver.Resolve(*authConfig.APIKey, variables)
			if err != nil {
				return nil, fmt.Errorf("failed to resolve API key: %w", err)
			}
			keyName, err := b.resolver.Resolve(*authConfig.APIKeyName, variables)
			if err != nil {
				return nil, fmt.Errorf("failed to resolve API key name: %w", err)
			}
			params[keyName] = key
		}
	}

	return params, nil
}
