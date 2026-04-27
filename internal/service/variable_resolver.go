package service

import (
	"fmt"
	"regexp"
	"strings"

	"hitme-http/internal/domain"
)

// VariableResolver resolves variable placeholders in strings
type VariableResolver struct {
	maxDepth int
}

// NewVariableResolver creates a new variable resolver
func NewVariableResolver() *VariableResolver {
	return &VariableResolver{
		maxDepth: 10, // Prevent infinite recursion
	}
}

// Resolve resolves all variable placeholders in a template string
func (r *VariableResolver) Resolve(template string, variables map[string]string) (string, error) {
	return r.resolveRecursive(template, variables, 0, make(map[string]bool))
}

// resolveRecursive resolves variables recursively with cycle detection
func (r *VariableResolver) resolveRecursive(template string, variables map[string]string, depth int, visiting map[string]bool) (string, error) {
	if depth > r.maxDepth {
		return "", domain.NewValidationError("maximum recursion depth exceeded (possible circular reference)", nil)
	}

	placeholders := r.FindPlaceholders(template)
	if len(placeholders) == 0 {
		return template, nil
	}

	result := template
	for _, placeholder := range placeholders {
		varName := placeholder[2 : len(placeholder)-2] // Remove {{ and }}

		// Check for circular reference
		if visiting[varName] {
			return "", domain.NewValidationError(fmt.Sprintf("circular reference detected: %s", varName), nil)
		}

		value, exists := variables[varName]
		if !exists {
			return "", domain.NewValidationError(fmt.Sprintf("unresolved variable: %s", varName), nil)
		}

		// Mark as visiting
		visiting[varName] = true

		// Recursively resolve the value
		resolvedValue, err := r.resolveRecursive(value, variables, depth+1, visiting)
		if err != nil {
			return "", err
		}

		// Unmark visiting
		delete(visiting, varName)

		// Replace placeholder with resolved value
		result = strings.ReplaceAll(result, placeholder, resolvedValue)
	}

	return result, nil
}

// FindPlaceholders finds all variable placeholders in a string
func (r *VariableResolver) FindPlaceholders(template string) []string {
	re := regexp.MustCompile(`\{\{[^}]+\}\}`)
	return re.FindAllString(template, -1)
}

// ValidatePlaceholders validates that all placeholders can be resolved
func (r *VariableResolver) ValidatePlaceholders(template string, variables map[string]string) []string {
	placeholders := r.FindPlaceholders(template)
	unresolved := make([]string, 0)

	for _, placeholder := range placeholders {
		varName := placeholder[2 : len(placeholder)-2]
		if _, exists := variables[varName]; !exists {
			unresolved = append(unresolved, varName)
		}
	}

	return unresolved
}

// ResolveRequest resolves all variables in a request
func (r *VariableResolver) ResolveRequest(request *domain.RequestNode, variables map[string]string) (*domain.RequestNode, error) {
	resolved := &domain.RequestNode{
		ID:              request.ID,
		CollectionID:    request.CollectionID,
		Name:            request.Name,
		Method:          request.Method,
		URL:             request.URL,
		QueryParams:     request.QueryParams,
		Headers:         request.Headers,
		Body:            request.Body,
		AuthOverride:    request.AuthOverride,
		ProxyOverrideID: request.ProxyOverrideID,
		LastRun:         request.LastRun,
		CreatedAt:       request.CreatedAt,
		UpdatedAt:       request.UpdatedAt,
	}

	// Resolve URL
	url, err := r.Resolve(request.URL, variables)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve URL: %w", err)
	}
	resolved.URL = url

	// Resolve query params
	if request.QueryParams != nil {
		resolvedParams := make([]*domain.KeyValueItem, len(request.QueryParams))
		for i, param := range request.QueryParams {
			key, err := r.Resolve(param.Key, variables)
			if err != nil {
				return nil, fmt.Errorf("failed to resolve query param key: %w", err)
			}
			value, err := r.Resolve(param.Value, variables)
			if err != nil {
				return nil, fmt.Errorf("failed to resolve query param value: %w", err)
			}
			resolvedParams[i] = &domain.KeyValueItem{
				Key:     key,
				Value:   value,
				Enabled: param.Enabled,
			}
		}
		resolved.QueryParams = resolvedParams
	}

	// Resolve headers
	if request.Headers != nil {
		resolvedHeaders := make([]*domain.KeyValueItem, len(request.Headers))
		for i, header := range request.Headers {
			key, err := r.Resolve(header.Key, variables)
			if err != nil {
				return nil, fmt.Errorf("failed to resolve header key: %w", err)
			}
			value, err := r.Resolve(header.Value, variables)
			if err != nil {
				return nil, fmt.Errorf("failed to resolve header value: %w", err)
			}
			resolvedHeaders[i] = &domain.KeyValueItem{
				Key:     key,
				Value:   value,
				Enabled: header.Enabled,
			}
		}
		resolved.Headers = resolvedHeaders
	}

	// Resolve body
	if request.Body != nil && request.Body.Content != "" {
		content, err := r.Resolve(request.Body.Content, variables)
		if err != nil {
			return nil, fmt.Errorf("failed to resolve body content: %w", err)
		}
		resolved.Body = &domain.BodyConfig{
			Type:     request.Body.Type,
			Content:  content,
			FormData: request.Body.FormData,
		}
	}

	return resolved, nil
}
