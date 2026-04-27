package service

import (
	"testing"

	"hitme-http/internal/domain"
	"hitme-http/internal/persistence"
)

func TestCollectionService_CreateCollection(t *testing.T) {
	tempDir := t.TempDir()
	repo, _ := persistence.NewFileCollectionRepository(tempDir)
	svc := NewCollectionService(repo)

	collection, err := svc.CreateCollection("Test Collection")
	if err != nil {
		t.Fatalf("Failed to create collection: %v", err)
	}

	if collection.Name != "Test Collection" {
		t.Errorf("Expected name 'Test Collection', got %s", collection.Name)
	}
	if collection.ID == "" {
		t.Error("Expected non-empty ID")
	}
}

func TestCollectionService_AddRequest(t *testing.T) {
	tempDir := t.TempDir()
	repo, _ := persistence.NewFileCollectionRepository(tempDir)
	svc := NewCollectionService(repo)

	// Create collection
	collection, _ := svc.CreateCollection("Test Collection")

	// Add request
	request := &domain.RequestNode{
		Name:   "Get Users",
		Method: "GET",
		URL:    "https://api.example.com/users",
		QueryParams: []*domain.KeyValueItem{
			{Key: "page", Value: "1", Enabled: true},
		},
		Headers: []*domain.KeyValueItem{
			{Key: "Content-Type", Value: "application/json", Enabled: true},
		},
		Body: &domain.BodyConfig{Type: "none"},
	}

	err := svc.AddRequest(collection.ID, request)
	if err != nil {
		t.Fatalf("Failed to add request: %v", err)
	}

	// Verify request was added
	updated, _ := svc.GetCollection(collection.ID)
	if len(updated.Requests) != 1 {
		t.Errorf("Expected 1 request, got %d", len(updated.Requests))
	}
	if updated.Requests[0].Name != "Get Users" {
		t.Errorf("Expected name 'Get Users', got %s", updated.Requests[0].Name)
	}
}

func TestCollectionService_UpdateRequest(t *testing.T) {
	tempDir := t.TempDir()
	repo, _ := persistence.NewFileCollectionRepository(tempDir)
	svc := NewCollectionService(repo)

	// Create collection and add request
	collection, _ := svc.CreateCollection("Test Collection")
	request := &domain.RequestNode{
		Name:   "Original Name",
		Method: "GET",
		URL:    "https://api.example.com/users",
		Body:   &domain.BodyConfig{Type: "none"},
	}
	svc.AddRequest(collection.ID, request)

	// Get the request with ID
	updated, _ := svc.GetCollection(collection.ID)
	req := updated.Requests[0]

	// Update request
	req.Name = "Updated Name"
	req.Method = "POST"
	err := svc.UpdateRequest(collection.ID, req)
	if err != nil {
		t.Fatalf("Failed to update request: %v", err)
	}

	// Verify update
	updated, _ = svc.GetCollection(collection.ID)
	if updated.Requests[0].Name != "Updated Name" {
		t.Errorf("Expected name 'Updated Name', got %s", updated.Requests[0].Name)
	}
	if updated.Requests[0].Method != "POST" {
		t.Errorf("Expected method 'POST', got %s", updated.Requests[0].Method)
	}
}

func TestCollectionService_DeleteRequest(t *testing.T) {
	tempDir := t.TempDir()
	repo, _ := persistence.NewFileCollectionRepository(tempDir)
	svc := NewCollectionService(repo)

	// Create collection and add request
	collection, _ := svc.CreateCollection("Test Collection")
	request := &domain.RequestNode{
		Name:   "Test Request",
		Method: "GET",
		URL:    "https://api.example.com/users",
		Body:   &domain.BodyConfig{Type: "none"},
	}
	svc.AddRequest(collection.ID, request)

	// Get the request ID
	updated, _ := svc.GetCollection(collection.ID)
	requestID := updated.Requests[0].ID

	// Delete request
	err := svc.DeleteRequest(collection.ID, requestID)
	if err != nil {
		t.Fatalf("Failed to delete request: %v", err)
	}

	// Verify deletion
	updated, _ = svc.GetCollection(collection.ID)
	if len(updated.Requests) != 0 {
		t.Errorf("Expected 0 requests, got %d", len(updated.Requests))
	}
}

func TestCollectionService_DuplicateRequest(t *testing.T) {
	tempDir := t.TempDir()
	repo, _ := persistence.NewFileCollectionRepository(tempDir)
	svc := NewCollectionService(repo)

	// Create collection and add request
	collection, _ := svc.CreateCollection("Test Collection")
	request := &domain.RequestNode{
		Name:   "Original Request",
		Method: "GET",
		URL:    "https://api.example.com/users",
		QueryParams: []*domain.KeyValueItem{
			{Key: "page", Value: "1", Enabled: true},
		},
		Body: &domain.BodyConfig{Type: "none"},
	}
	svc.AddRequest(collection.ID, request)

	// Get the request ID
	updated, _ := svc.GetCollection(collection.ID)
	requestID := updated.Requests[0].ID

	// Duplicate request
	duplicate, err := svc.DuplicateRequest(collection.ID, requestID)
	if err != nil {
		t.Fatalf("Failed to duplicate request: %v", err)
	}

	// Verify duplicate
	if duplicate.Name != "Original Request (Copy)" {
		t.Errorf("Expected name 'Original Request (Copy)', got %s", duplicate.Name)
	}
	if duplicate.ID == requestID {
		t.Error("Duplicate should have different ID")
	}

	// Verify collection has 2 requests
	updated, _ = svc.GetCollection(collection.ID)
	if len(updated.Requests) != 2 {
		t.Errorf("Expected 2 requests, got %d", len(updated.Requests))
	}
}

func TestCollectionService_Validation(t *testing.T) {
	tempDir := t.TempDir()
	repo, _ := persistence.NewFileCollectionRepository(tempDir)
	svc := NewCollectionService(repo)

	// Test empty collection name
	_, err := svc.CreateCollection("")
	if err == nil {
		t.Error("Expected error for empty collection name")
	}

	// Create valid collection
	collection, _ := svc.CreateCollection("Test Collection")

	// Test empty request name
	request := &domain.RequestNode{
		Name:   "",
		Method: "GET",
		URL:    "https://api.example.com",
		Body:   &domain.BodyConfig{Type: "none"},
	}
	err = svc.AddRequest(collection.ID, request)
	if err == nil {
		t.Error("Expected error for empty request name")
	}

	// Test empty method
	request.Name = "Test"
	request.Method = ""
	err = svc.AddRequest(collection.ID, request)
	if err == nil {
		t.Error("Expected error for empty method")
	}

	// Test invalid method
	request.Method = "INVALID"
	err = svc.AddRequest(collection.ID, request)
	if err == nil {
		t.Error("Expected error for invalid method")
	}

	// Test empty URL
	request.Method = "GET"
	request.URL = ""
	err = svc.AddRequest(collection.ID, request)
	if err == nil {
		t.Error("Expected error for empty URL")
	}
}
