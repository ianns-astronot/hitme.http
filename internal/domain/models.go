package domain

import "time"

// Collection represents a workspace containing requests and global configurations
type Collection struct {
	ID            string                 `json:"id"`
	Name          string                 `json:"name"`
	Variables     map[string]string      `json:"variables"`
	GlobalAuth    *AuthConfig            `json:"globalAuth"`
	Proxies       []*ProxyConfig         `json:"proxies"`
	ActiveProxyID *string                `json:"activeProxyId"`
	Requests      []*RequestNode         `json:"requests"`
	CreatedAt     time.Time              `json:"createdAt"`
	UpdatedAt     time.Time              `json:"updatedAt"`
}

// RequestNode represents an HTTP request entity
type RequestNode struct {
	ID              string            `json:"id"`
	CollectionID    string            `json:"collectionId"`
	Name            string            `json:"name"`
	Method          string            `json:"method"`
	URL             string            `json:"url"`
	QueryParams     []*KeyValueItem   `json:"queryParams"`
	Headers         []*KeyValueItem   `json:"headers"`
	Body            *BodyConfig       `json:"body"`
	AuthOverride    *AuthConfig       `json:"authOverride"`
	ProxyOverrideID *string           `json:"proxyOverrideId"`
	LastRun         *ExecutionResult  `json:"lastRun"`
	CreatedAt       time.Time         `json:"createdAt"`
	UpdatedAt       time.Time         `json:"updatedAt"`
}

// AuthConfig represents authentication configuration
type AuthConfig struct {
	Type           string  `json:"type"` // none, bearer, basic, apikey
	BearerToken    *string `json:"bearerToken,omitempty"`
	Username       *string `json:"username,omitempty"`
	Password       *string `json:"password,omitempty"`
	APIKey         *string `json:"apiKey,omitempty"`
	APIKeyLocation *string `json:"apiKeyLocation,omitempty"` // header, query
	APIKeyName     *string `json:"apiKeyName,omitempty"`
}

// ProxyConfig represents proxy configuration
type ProxyConfig struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Scheme   string  `json:"scheme"` // http, https, socks5
	Host     string  `json:"host"`
	Port     int     `json:"port"`
	Username *string `json:"username,omitempty"`
	Password *string `json:"password,omitempty"`
}

// KeyValueItem represents a key-value pair with enable/disable toggle
type KeyValueItem struct {
	Key     string `json:"key"`
	Value   string `json:"value"`
	Enabled bool   `json:"enabled"`
}

// BodyConfig represents request body configuration
type BodyConfig struct {
	Type    string           `json:"type"` // none, raw, json, form-urlencoded
	Content string           `json:"content,omitempty"`
	FormData []*KeyValueItem `json:"formData,omitempty"`
}

// ExecutionResult represents the result of request execution
type ExecutionResult struct {
	StatusCode     int               `json:"statusCode"`
	StatusText     string            `json:"statusText"`
	ResponseTime   int64             `json:"responseTime"` // in milliseconds
	ResponseSize   int64             `json:"responseSize"` // in bytes
	ResponseHeaders map[string]string `json:"responseHeaders"`
	ResponseBody   string            `json:"responseBody"`
	Error          *string           `json:"error,omitempty"`
	Timestamp      time.Time         `json:"timestamp"`
}
