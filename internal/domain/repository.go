package domain

// CollectionRepository defines the interface for collection persistence
type CollectionRepository interface {
	Create(collection *Collection) error
	Update(collection *Collection) error
	Delete(id string) error
	FindByID(id string) (*Collection, error)
	FindAll() ([]*Collection, error)
}
