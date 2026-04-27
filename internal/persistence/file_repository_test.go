package persistence

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"hitme-http/internal/domain"
)

func TestFileCollectionRepository_Create(t *testing.T) {
	// Setup temp directory
	tempDir := t.TempDir()
	repo, err := NewFileCollectionRepository(tempDir)
	if err != nil {
		t.Fatalf("Failed to create repository: %v", err)
	}

	// Create collection
	now := time.Now()
	collection := &domain.Collection{
		ID:            "test-id",
		Name:          "Test Collection",
		Variables:     map[string]string{},
		GlobalAuth:    &domain.AuthConfig{Type: "none"},
		Proxies:       []*domain.ProxyConfig{},
		ActiveProxyID: nil,
		Requests:      []*domain.RequestNode{},
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	err = repo.Create(collection)
	if err != nil {
		t.Fatalf("Failed to create collection: %v", err)
	}

	// Verify file exists
	filePath := filepath.Join(tempDir, "test-id.json")
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		t.Errorf("Collection file was not created")
	}

	// Try to create duplicate
	err = repo.Create(collection)
	if err == nil {
		t.Errorf("Expected error when creating duplicate collection")
	}
}

func TestFileCollectionRepository_FindByID(t *testing.T) {
	// Setup
	tempDir := t.TempDir()
	repo, _ := NewFileCollectionRepository(tempDir)

	now := time.Now()
	original := &domain.Collection{
		ID:            "test-id",
		Name:          "Test Collection",
		Variables:     map[string]string{"key": "value"},
		GlobalAuth:    &domain.AuthConfig{Type: "bearer"},
		Proxies:       []*domain.ProxyConfig{},
		ActiveProxyID: nil,
		Requests:      []*domain.RequestNode{},
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	repo.Create(original)

	// Find by ID
	found, err := repo.FindByID("test-id")
	if err != nil {
		t.Fatalf("Failed to find collection: %v", err)
	}

	if found.ID != original.ID {
		t.Errorf("Expected ID %s, got %s", original.ID, found.ID)
	}
	if found.Name != original.Name {
		t.Errorf("Expected Name %s, got %s", original.Name, found.Name)
	}
	if found.Variables["key"] != original.Variables["key"] {
		t.Errorf("Expected variable value %s, got %s", original.Variables["key"], found.Variables["key"])
	}

	// Find non-existent
	_, err = repo.FindByID("non-existent")
	if err == nil {
		t.Errorf("Expected error when finding non-existent collection")
	}
}

func TestFileCollectionRepository_Update(t *testing.T) {
	// Setup
	tempDir := t.TempDir()
	repo, _ := NewFileCollectionRepository(tempDir)

	now := time.Now()
	collection := &domain.Collection{
		ID:            "test-id",
		Name:          "Original Name",
		Variables:     map[string]string{},
		GlobalAuth:    &domain.AuthConfig{Type: "none"},
		Proxies:       []*domain.ProxyConfig{},
		ActiveProxyID: nil,
		Requests:      []*domain.RequestNode{},
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	repo.Create(collection)

	// Update
	collection.Name = "Updated Name"
	collection.Variables["newKey"] = "newValue"
	err := repo.Update(collection)
	if err != nil {
		t.Fatalf("Failed to update collection: %v", err)
	}

	// Verify update
	found, _ := repo.FindByID("test-id")
	if found.Name != "Updated Name" {
		t.Errorf("Expected Name 'Updated Name', got %s", found.Name)
	}
	if found.Variables["newKey"] != "newValue" {
		t.Errorf("Expected variable newKey=newValue, got %s", found.Variables["newKey"])
	}

	// Update non-existent
	nonExistent := &domain.Collection{ID: "non-existent", Name: "Test"}
	err = repo.Update(nonExistent)
	if err == nil {
		t.Errorf("Expected error when updating non-existent collection")
	}
}

func TestFileCollectionRepository_Delete(t *testing.T) {
	// Setup
	tempDir := t.TempDir()
	repo, _ := NewFileCollectionRepository(tempDir)

	now := time.Now()
	collection := &domain.Collection{
		ID:            "test-id",
		Name:          "Test Collection",
		Variables:     map[string]string{},
		GlobalAuth:    &domain.AuthConfig{Type: "none"},
		Proxies:       []*domain.ProxyConfig{},
		ActiveProxyID: nil,
		Requests:      []*domain.RequestNode{},
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	repo.Create(collection)

	// Delete
	err := repo.Delete("test-id")
	if err != nil {
		t.Fatalf("Failed to delete collection: %v", err)
	}

	// Verify deletion
	filePath := filepath.Join(tempDir, "test-id.json")
	if _, err := os.Stat(filePath); !os.IsNotExist(err) {
		t.Errorf("Collection file was not deleted")
	}

	// Delete non-existent
	err = repo.Delete("non-existent")
	if err == nil {
		t.Errorf("Expected error when deleting non-existent collection")
	}
}

func TestFileCollectionRepository_FindAll(t *testing.T) {
	// Setup
	tempDir := t.TempDir()
	repo, _ := NewFileCollectionRepository(tempDir)

	// Create multiple collections
	now := time.Now()
	for i := 1; i <= 3; i++ {
		collection := &domain.Collection{
			ID:            string(rune('a' + i)),
			Name:          "Collection " + string(rune('0'+i)),
			Variables:     map[string]string{},
			GlobalAuth:    &domain.AuthConfig{Type: "none"},
			Proxies:       []*domain.ProxyConfig{},
			ActiveProxyID: nil,
			Requests:      []*domain.RequestNode{},
			CreatedAt:     now,
			UpdatedAt:     now,
		}
		repo.Create(collection)
	}

	// Find all
	collections, err := repo.FindAll()
	if err != nil {
		t.Fatalf("Failed to find all collections: %v", err)
	}

	if len(collections) != 3 {
		t.Errorf("Expected 3 collections, got %d", len(collections))
	}
}
