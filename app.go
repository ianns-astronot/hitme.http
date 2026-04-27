package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"hitme-http/internal/domain"
	"hitme-http/internal/persistence"
	"hitme-http/internal/service"
	"hitme-http/internal/transport"
)

// App struct
type App struct {
	ctx             context.Context
	collectionSvc   *service.CollectionService
	httpExecutor    *transport.HTTPExecutor
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	
	// Initialize repository
	homeDir, err := os.UserHomeDir()
	if err != nil {
		fmt.Printf("Failed to get home directory: %v\n", err)
		return
	}
	
	dataDir := filepath.Join(homeDir, ".hitme", "collections")
	repo, err := persistence.NewFileCollectionRepository(dataDir)
	if err != nil {
		fmt.Printf("Failed to initialize repository: %v\n", err)
		return
	}
	
	// Initialize services
	a.collectionSvc = service.NewCollectionService(repo)
	a.httpExecutor = transport.NewHTTPExecutor()
}

// Collection Management

// GetCollections returns all collections
func (a *App) GetCollections() ([]*domain.Collection, error) {
	return a.collectionSvc.GetAllCollections()
}

// GetCollection returns a collection by ID
func (a *App) GetCollection(id string) (*domain.Collection, error) {
	return a.collectionSvc.GetCollection(id)
}

// CreateCollection creates a new collection
func (a *App) CreateCollection(name string) (*domain.Collection, error) {
	return a.collectionSvc.CreateCollection(name)
}

// UpdateCollection updates an existing collection
func (a *App) UpdateCollection(collection *domain.Collection) error {
	return a.collectionSvc.UpdateCollection(collection)
}

// DeleteCollection deletes a collection
func (a *App) DeleteCollection(id string) error {
	return a.collectionSvc.DeleteCollection(id)
}

// Request Management

// AddRequest adds a request to a collection
func (a *App) AddRequest(collectionID string, request *domain.RequestNode) error {
	return a.collectionSvc.AddRequest(collectionID, request)
}

// UpdateRequest updates a request in a collection
func (a *App) UpdateRequest(collectionID string, request *domain.RequestNode) error {
	return a.collectionSvc.UpdateRequest(collectionID, request)
}

// DeleteRequest deletes a request from a collection
func (a *App) DeleteRequest(collectionID, requestID string) error {
	return a.collectionSvc.DeleteRequest(collectionID, requestID)
}

// DuplicateRequest duplicates a request in a collection
func (a *App) DuplicateRequest(collectionID, requestID string) (*domain.RequestNode, error) {
	return a.collectionSvc.DuplicateRequest(collectionID, requestID)
}

// Request Execution

// ExecuteRequest executes an HTTP request
func (a *App) ExecuteRequest(collectionID, requestID string) (*domain.ExecutionResult, error) {
	// Get collection
	collection, err := a.collectionSvc.GetCollection(collectionID)
	if err != nil {
		return nil, err
	}

	// Find request
	var request *domain.RequestNode
	for _, r := range collection.Requests {
		if r.ID == requestID {
			request = r
			break
		}
	}

	if request == nil {
		return nil, domain.NewValidationError("request not found", nil)
	}

	// Execute request
	result, err := a.httpExecutor.Execute(request)
	
	// Save result to lastRun (even if error)
	if result != nil {
		request.LastRun = result
		a.collectionSvc.UpdateRequest(collectionID, request)
	}

	return result, err
}
