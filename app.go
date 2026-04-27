package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"hitme-http/internal/domain"
	"hitme-http/internal/persistence"

	"github.com/google/uuid"
)

// App struct
type App struct {
	ctx  context.Context
	repo domain.CollectionRepository
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
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
	
	a.repo = repo
}

// GetCollections returns all collections
func (a *App) GetCollections() ([]*domain.Collection, error) {
	return a.repo.FindAll()
}

// GetCollection returns a collection by ID
func (a *App) GetCollection(id string) (*domain.Collection, error) {
	return a.repo.FindByID(id)
}

// CreateCollection creates a new collection
func (a *App) CreateCollection(name string) (*domain.Collection, error) {
	if name == "" {
		return nil, domain.NewValidationError("collection name is required", nil)
	}

	now := time.Now()
	collection := &domain.Collection{
		ID:            uuid.New().String(),
		Name:          name,
		Variables:     make(map[string]string),
		GlobalAuth:    &domain.AuthConfig{Type: "none"},
		Proxies:       make([]*domain.ProxyConfig, 0),
		ActiveProxyID: nil,
		Requests:      make([]*domain.RequestNode, 0),
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := a.repo.Create(collection); err != nil {
		return nil, err
	}

	return collection, nil
}

// UpdateCollection updates an existing collection
func (a *App) UpdateCollection(collection *domain.Collection) error {
	if collection.ID == "" {
		return domain.NewValidationError("collection ID is required", nil)
	}
	if collection.Name == "" {
		return domain.NewValidationError("collection name is required", nil)
	}

	collection.UpdatedAt = time.Now()
	return a.repo.Update(collection)
}

// DeleteCollection deletes a collection
func (a *App) DeleteCollection(id string) error {
	if id == "" {
		return domain.NewValidationError("collection ID is required", nil)
	}

	return a.repo.Delete(id)
}
