package service

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"hitme-http/internal/domain"
)

// ExportFormat represents the export file format
type ExportFormat struct {
	Version    string              `json:"version"`
	ExportedAt time.Time           `json:"exportedAt"`
	AppVersion string              `json:"appVersion"`
	Collection *domain.Collection  `json:"collection"`
}

// ImportExportService handles import/export operations
type ImportExportService struct {
	sanitizer *domain.LogSanitizer
}

// NewImportExportService creates a new import/export service
func NewImportExportService() *ImportExportService {
	return &ImportExportService{
		sanitizer: domain.NewLogSanitizer(),
	}
}

// ExportCollection exports a collection to JSON file
func (s *ImportExportService) ExportCollection(collection *domain.Collection, filePath string, includeSensitive bool) error {
	// Create export format
	exportData := &ExportFormat{
		Version:    "1.0",
		ExportedAt: time.Now(),
		AppVersion: "0.1.0",
		Collection: collection,
	}

	// Sanitize sensitive data if not including
	if !includeSensitive {
		exportData.Collection = s.sanitizeCollection(collection)
	}

	// Marshal to JSON
	data, err := json.MarshalIndent(exportData, "", "  ")
	if err != nil {
		return domain.NewPersistenceError("failed to marshal collection", err)
	}

	// Write to file
	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return domain.NewPersistenceError("failed to write export file", err)
	}

	return nil
}

// ImportCollection imports a collection from JSON file
func (s *ImportExportService) ImportCollection(filePath string) (*domain.Collection, error) {
	// Read file
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, domain.NewPersistenceError("failed to read import file", err)
	}

	// Unmarshal JSON
	var exportData ExportFormat
	if err := json.Unmarshal(data, &exportData); err != nil {
		return nil, domain.NewPersistenceError("failed to parse import file", err)
	}

	// Validate version
	if exportData.Version != "1.0" {
		return nil, domain.NewValidationError(fmt.Sprintf("unsupported export version: %s", exportData.Version), nil)
	}

	// Validate collection
	if exportData.Collection == nil {
		return nil, domain.NewValidationError("collection data not found in import file", nil)
	}

	// Update timestamps
	now := time.Now()
	exportData.Collection.UpdatedAt = now

	return exportData.Collection, nil
}

// sanitizeCollection creates a sanitized copy of collection without sensitive data
func (s *ImportExportService) sanitizeCollection(collection *domain.Collection) *domain.Collection {
	sanitized := &domain.Collection{
		ID:            collection.ID,
		Name:          collection.Name,
		Variables:     s.sanitizeVariables(collection.Variables),
		GlobalAuth:    s.sanitizer.SanitizeAuthConfig(collection.GlobalAuth),
		Proxies:       s.sanitizeProxies(collection.Proxies),
		ActiveProxyID: collection.ActiveProxyID,
		Requests:      s.sanitizeRequests(collection.Requests),
		CreatedAt:     collection.CreatedAt,
		UpdatedAt:     collection.UpdatedAt,
	}

	return sanitized
}

// sanitizeVariables sanitizes variables (remove sensitive ones)
func (s *ImportExportService) sanitizeVariables(variables map[string]string) map[string]string {
	sanitized := make(map[string]string)
	for key, value := range variables {
		// Check if variable name suggests it's sensitive
		if s.sanitizer.IsSensitive(key) {
			sanitized[key] = "***REDACTED***"
		} else {
			sanitized[key] = value
		}
	}
	return sanitized
}

// sanitizeProxies sanitizes proxy configurations
func (s *ImportExportService) sanitizeProxies(proxies []*domain.ProxyConfig) []*domain.ProxyConfig {
	sanitized := make([]*domain.ProxyConfig, len(proxies))
	for i, proxy := range proxies {
		sanitized[i] = s.sanitizer.SanitizeProxyConfig(proxy)
	}
	return sanitized
}

// sanitizeRequests sanitizes requests
func (s *ImportExportService) sanitizeRequests(requests []*domain.RequestNode) []*domain.RequestNode {
	sanitized := make([]*domain.RequestNode, len(requests))
	for i, request := range requests {
		sanitized[i] = &domain.RequestNode{
			ID:              request.ID,
			CollectionID:    request.CollectionID,
			Name:            request.Name,
			Method:          request.Method,
			URL:             request.URL,
			QueryParams:     request.QueryParams,
			Headers:         s.sanitizeHeaders(request.Headers),
			Body:            request.Body,
			AuthOverride:    s.sanitizer.SanitizeAuthConfig(request.AuthOverride),
			ProxyOverrideID: request.ProxyOverrideID,
			LastRun:         nil, // Don't export last run
			CreatedAt:       request.CreatedAt,
			UpdatedAt:       request.UpdatedAt,
		}
	}
	return sanitized
}

// sanitizeHeaders sanitizes headers
func (s *ImportExportService) sanitizeHeaders(headers []*domain.KeyValueItem) []*domain.KeyValueItem {
	sanitized := make([]*domain.KeyValueItem, len(headers))
	for i, header := range headers {
		if s.sanitizer.IsSensitive(header.Key) {
			sanitized[i] = &domain.KeyValueItem{
				Key:     header.Key,
				Value:   "***REDACTED***",
				Enabled: header.Enabled,
			}
		} else {
			sanitized[i] = header
		}
	}
	return sanitized
}
