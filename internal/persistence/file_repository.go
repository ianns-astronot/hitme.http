package persistence

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"hitme-http/internal/domain"
)

// FileCollectionRepository implements CollectionRepository using file system
type FileCollectionRepository struct {
	dataDir string
	mu      sync.RWMutex
}

// NewFileCollectionRepository creates a new file-based collection repository
func NewFileCollectionRepository(dataDir string) (*FileCollectionRepository, error) {
	// Create data directory if not exists
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, domain.NewPersistenceError("failed to create data directory", err)
	}

	return &FileCollectionRepository{
		dataDir: dataDir,
	}, nil
}

// Create saves a new collection
func (r *FileCollectionRepository) Create(collection *domain.Collection) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	filePath := r.getFilePath(collection.ID)
	
	// Check if file already exists
	if _, err := os.Stat(filePath); err == nil {
		return domain.NewPersistenceError("collection already exists", nil)
	}

	return r.writeCollection(filePath, collection)
}

// Update updates an existing collection
func (r *FileCollectionRepository) Update(collection *domain.Collection) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	filePath := r.getFilePath(collection.ID)
	
	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return domain.NewPersistenceError("collection not found", nil)
	}

	return r.writeCollection(filePath, collection)
}

// Delete removes a collection
func (r *FileCollectionRepository) Delete(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	filePath := r.getFilePath(id)
	
	if err := os.Remove(filePath); err != nil {
		if os.IsNotExist(err) {
			return domain.NewPersistenceError("collection not found", err)
		}
		return domain.NewPersistenceError("failed to delete collection", err)
	}

	return nil
}

// FindByID retrieves a collection by ID
func (r *FileCollectionRepository) FindByID(id string) (*domain.Collection, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	filePath := r.getFilePath(id)
	
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, domain.NewPersistenceError("collection not found", err)
		}
		return nil, domain.NewPersistenceError("failed to read collection", err)
	}

	var collection domain.Collection
	if err := json.Unmarshal(data, &collection); err != nil {
		return nil, domain.NewPersistenceError("failed to parse collection", err)
	}

	return &collection, nil
}

// FindAll retrieves all collections
func (r *FileCollectionRepository) FindAll() ([]*domain.Collection, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	files, err := os.ReadDir(r.dataDir)
	if err != nil {
		return nil, domain.NewPersistenceError("failed to read data directory", err)
	}

	collections := make([]*domain.Collection, 0)
	for _, file := range files {
		if file.IsDir() || filepath.Ext(file.Name()) != ".json" {
			continue
		}

		filePath := filepath.Join(r.dataDir, file.Name())
		data, err := os.ReadFile(filePath)
		if err != nil {
			continue // Skip files that can't be read
		}

		var collection domain.Collection
		if err := json.Unmarshal(data, &collection); err != nil {
			continue // Skip files that can't be parsed
		}

		collections = append(collections, &collection)
	}

	return collections, nil
}

// writeCollection writes collection to file atomically
func (r *FileCollectionRepository) writeCollection(filePath string, collection *domain.Collection) error {
	data, err := json.MarshalIndent(collection, "", "  ")
	if err != nil {
		return domain.NewPersistenceError("failed to marshal collection", err)
	}

	// Write to temp file first
	tempPath := filePath + ".tmp"
	if err := os.WriteFile(tempPath, data, 0644); err != nil {
		return domain.NewPersistenceError("failed to write collection", err)
	}

	// Atomic rename
	if err := os.Rename(tempPath, filePath); err != nil {
		os.Remove(tempPath) // Clean up temp file
		return domain.NewPersistenceError("failed to save collection", err)
	}

	return nil
}

// getFilePath returns the file path for a collection ID
func (r *FileCollectionRepository) getFilePath(id string) string {
	return filepath.Join(r.dataDir, fmt.Sprintf("%s.json", id))
}
