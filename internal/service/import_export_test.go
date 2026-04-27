package service

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"hitme-http/internal/domain"

	"github.com/google/uuid"
)

func TestImportExportService_ExportImport(t *testing.T) {
	svc := NewImportExportService()
	tempDir := t.TempDir()
	exportPath := filepath.Join(tempDir, "export.json")

	// Create test collection
	collection := &domain.Collection{
		ID:   uuid.New().String(),
		Name: "Test Collection",
		Variables: map[string]string{
			"baseUrl": "https://api.example.com",
			"apiKey":  "secret-key-12345",
		},
		GlobalAuth: &domain.AuthConfig{
			Type:        "bearer",
			BearerToken: strPtr("test-token"),
		},
		Requests: []*domain.RequestNode{
			{
				ID:           uuid.New().String(),
				CollectionID: "",
				Name:         "Test Request",
				Method:       "GET",
				URL:          "{{baseUrl}}/users",
				Headers: []*domain.KeyValueItem{
					{Key: "Authorization", Value: "Bearer {{apiKey}}", Enabled: true},
				},
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Test export without sensitive data
	err := svc.ExportCollection(collection, exportPath, false)
	if err != nil {
		t.Fatalf("Failed to export collection: %v", err)
	}

	// Verify file exists
	if _, err := os.Stat(exportPath); os.IsNotExist(err) {
		t.Fatal("Export file was not created")
	}

	// Test import
	imported, err := svc.ImportCollection(exportPath)
	if err != nil {
		t.Fatalf("Failed to import collection: %v", err)
	}

	// Verify imported data
	if imported.Name != collection.Name {
		t.Errorf("Expected name %s, got %s", collection.Name, imported.Name)
	}

	// Verify sensitive data was sanitized
	if imported.Variables["apiKey"] != "***REDACTED***" {
		t.Errorf("Expected apiKey to be redacted, got %s", imported.Variables["apiKey"])
	}

	if imported.GlobalAuth == nil {
		t.Fatal("Expected GlobalAuth to be present")
	}

	if imported.GlobalAuth.BearerToken == nil {
		t.Fatal("Expected BearerToken to be present")
	}

	if *imported.GlobalAuth.BearerToken == "test-token" {
		t.Error("Expected bearer token to be masked, but got original value")
	}

	// Verify it's masked (should be te***en format)
	if !strings.Contains(*imported.GlobalAuth.BearerToken, "***") {
		t.Errorf("Expected bearer token to contain ***, got %s", *imported.GlobalAuth.BearerToken)
	}
}

func TestImportExportService_ExportWithSensitive(t *testing.T) {
	svc := NewImportExportService()
	tempDir := t.TempDir()
	exportPath := filepath.Join(tempDir, "export_sensitive.json")

	// Create test collection
	collection := &domain.Collection{
		ID:   uuid.New().String(),
		Name: "Test Collection",
		Variables: map[string]string{
			"apiKey": "secret-key-12345",
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Test export with sensitive data
	err := svc.ExportCollection(collection, exportPath, true)
	if err != nil {
		t.Fatalf("Failed to export collection: %v", err)
	}

	// Test import
	imported, err := svc.ImportCollection(exportPath)
	if err != nil {
		t.Fatalf("Failed to import collection: %v", err)
	}

	// Verify sensitive data was NOT sanitized
	if imported.Variables["apiKey"] != "secret-key-12345" {
		t.Errorf("Expected apiKey to be preserved, got %s", imported.Variables["apiKey"])
	}
}

func TestImportExportService_ImportInvalidFile(t *testing.T) {
	svc := NewImportExportService()
	tempDir := t.TempDir()
	invalidPath := filepath.Join(tempDir, "invalid.json")

	// Write invalid JSON
	os.WriteFile(invalidPath, []byte("invalid json"), 0644)

	// Test import
	_, err := svc.ImportCollection(invalidPath)
	if err == nil {
		t.Fatal("Expected error for invalid JSON, got nil")
	}
}

func TestImportExportService_ImportNonExistentFile(t *testing.T) {
	svc := NewImportExportService()

	// Test import
	_, err := svc.ImportCollection("/nonexistent/file.json")
	if err == nil {
		t.Fatal("Expected error for non-existent file, got nil")
	}
}

func strPtr(s string) *string {
	return &s
}
