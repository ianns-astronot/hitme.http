package service

import (
	"time"

	"hitme-http/internal/domain"

	"github.com/google/uuid"
)

// CollectionService provides business logic for collections
type CollectionService struct {
	repo      domain.CollectionRepository
	validator *domain.Validator
}

// NewCollectionService creates a new collection service
func NewCollectionService(repo domain.CollectionRepository) *CollectionService {
	return &CollectionService{
		repo:      repo,
		validator: domain.NewValidator(),
	}
}

// CreateCollection creates a new collection
func (s *CollectionService) CreateCollection(name string) (*domain.Collection, error) {
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

	if err := s.validator.ValidateCollection(collection); err != nil {
		return nil, err
	}

	if err := s.repo.Create(collection); err != nil {
		return nil, err
	}

	return collection, nil
}

// UpdateCollection updates an existing collection
func (s *CollectionService) UpdateCollection(collection *domain.Collection) error {
	if err := s.validator.ValidateCollection(collection); err != nil {
		return err
	}

	collection.UpdatedAt = time.Now()
	return s.repo.Update(collection)
}

// DeleteCollection deletes a collection
func (s *CollectionService) DeleteCollection(id string) error {
	return s.repo.Delete(id)
}

// GetCollection retrieves a collection by ID
func (s *CollectionService) GetCollection(id string) (*domain.Collection, error) {
	return s.repo.FindByID(id)
}

// GetAllCollections retrieves all collections
func (s *CollectionService) GetAllCollections() ([]*domain.Collection, error) {
	return s.repo.FindAll()
}

// AddRequest adds a request to a collection
func (s *CollectionService) AddRequest(collectionID string, request *domain.RequestNode) error {
	collection, err := s.repo.FindByID(collectionID)
	if err != nil {
		return err
	}

	now := time.Now()
	request.ID = uuid.New().String()
	request.CollectionID = collectionID
	request.CreatedAt = now
	request.UpdatedAt = now

	if err := s.validator.ValidateRequestNode(request); err != nil {
		return err
	}

	collection.Requests = append(collection.Requests, request)
	collection.UpdatedAt = now

	return s.repo.Update(collection)
}

// UpdateRequest updates a request in a collection
func (s *CollectionService) UpdateRequest(collectionID string, request *domain.RequestNode) error {
	collection, err := s.repo.FindByID(collectionID)
	if err != nil {
		return err
	}

	if err := s.validator.ValidateRequestNode(request); err != nil {
		return err
	}

	// Find and update the request
	found := false
	for i, r := range collection.Requests {
		if r.ID == request.ID {
			request.UpdatedAt = time.Now()
			collection.Requests[i] = request
			found = true
			break
		}
	}

	if !found {
		return domain.NewValidationError("request not found", nil)
	}

	collection.UpdatedAt = time.Now()
	return s.repo.Update(collection)
}

// DeleteRequest deletes a request from a collection
func (s *CollectionService) DeleteRequest(collectionID, requestID string) error {
	collection, err := s.repo.FindByID(collectionID)
	if err != nil {
		return err
	}

	// Find and remove the request
	newRequests := make([]*domain.RequestNode, 0)
	found := false
	for _, r := range collection.Requests {
		if r.ID != requestID {
			newRequests = append(newRequests, r)
		} else {
			found = true
		}
	}

	if !found {
		return domain.NewValidationError("request not found", nil)
	}

	collection.Requests = newRequests
	collection.UpdatedAt = time.Now()

	return s.repo.Update(collection)
}

// DuplicateRequest duplicates a request in a collection
func (s *CollectionService) DuplicateRequest(collectionID, requestID string) (*domain.RequestNode, error) {
	collection, err := s.repo.FindByID(collectionID)
	if err != nil {
		return nil, err
	}

	// Find the request to duplicate
	var original *domain.RequestNode
	for _, r := range collection.Requests {
		if r.ID == requestID {
			original = r
			break
		}
	}

	if original == nil {
		return nil, domain.NewValidationError("request not found", nil)
	}

	// Create duplicate
	now := time.Now()
	duplicate := &domain.RequestNode{
		ID:              uuid.New().String(),
		CollectionID:    collectionID,
		Name:            original.Name + " (Copy)",
		Method:          original.Method,
		URL:             original.URL,
		QueryParams:     copyKeyValueItems(original.QueryParams),
		Headers:         copyKeyValueItems(original.Headers),
		Body:            copyBodyConfig(original.Body),
		AuthOverride:    copyAuthConfig(original.AuthOverride),
		ProxyOverrideID: original.ProxyOverrideID,
		LastRun:         nil,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	collection.Requests = append(collection.Requests, duplicate)
	collection.UpdatedAt = now

	if err := s.repo.Update(collection); err != nil {
		return nil, err
	}

	return duplicate, nil
}

// Helper functions for deep copying
func copyKeyValueItems(items []*domain.KeyValueItem) []*domain.KeyValueItem {
	if items == nil {
		return nil
	}
	result := make([]*domain.KeyValueItem, len(items))
	for i, item := range items {
		result[i] = &domain.KeyValueItem{
			Key:     item.Key,
			Value:   item.Value,
			Enabled: item.Enabled,
		}
	}
	return result
}

func copyBodyConfig(body *domain.BodyConfig) *domain.BodyConfig {
	if body == nil {
		return nil
	}
	return &domain.BodyConfig{
		Type:     body.Type,
		Content:  body.Content,
		FormData: copyKeyValueItems(body.FormData),
	}
}

func copyAuthConfig(auth *domain.AuthConfig) *domain.AuthConfig {
	if auth == nil {
		return nil
	}
	return &domain.AuthConfig{
		Type:           auth.Type,
		BearerToken:    copyStringPtr(auth.BearerToken),
		Username:       copyStringPtr(auth.Username),
		Password:       copyStringPtr(auth.Password),
		APIKey:         copyStringPtr(auth.APIKey),
		APIKeyLocation: copyStringPtr(auth.APIKeyLocation),
		APIKeyName:     copyStringPtr(auth.APIKeyName),
	}
}

func copyStringPtr(s *string) *string {
	if s == nil {
		return nil
	}
	copy := *s
	return &copy
}
