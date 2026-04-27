package domain

// Validator provides validation functions for domain models
type Validator struct{}

// NewValidator creates a new validator
func NewValidator() *Validator {
	return &Validator{}
}

// ValidateCollection validates a collection
func (v *Validator) ValidateCollection(collection *Collection) error {
	if collection.Name == "" {
		return NewValidationError("collection name is required", nil)
	}
	return nil
}

// ValidateRequestNode validates a request node
func (v *Validator) ValidateRequestNode(request *RequestNode) error {
	if request.Name == "" {
		return NewValidationError("request name is required", nil)
	}
	if request.Method == "" {
		return NewValidationError("request method is required", nil)
	}
	if request.URL == "" {
		return NewValidationError("request URL is required", nil)
	}
	
	// Validate method
	validMethods := map[string]bool{
		"GET": true, "POST": true, "PUT": true, "PATCH": true,
		"DELETE": true, "HEAD": true, "OPTIONS": true,
	}
	if !validMethods[request.Method] {
		return NewValidationError("invalid HTTP method", nil)
	}
	
	// Validate JSON body if type is json
	if request.Body != nil && request.Body.Type == "json" && request.Body.Content != "" {
		// Basic JSON validation will be done by json.Unmarshal in executor
	}
	
	return nil
}

// ValidateProxyConfig validates a proxy configuration
func (v *Validator) ValidateProxyConfig(proxy *ProxyConfig) error {
	if proxy.Host == "" {
		return NewValidationError("proxy host is required", nil)
	}
	if proxy.Port < 1 || proxy.Port > 65535 {
		return NewValidationError("proxy port must be between 1 and 65535", nil)
	}
	
	validSchemes := map[string]bool{"http": true, "https": true, "socks5": true}
	if !validSchemes[proxy.Scheme] {
		return NewValidationError("invalid proxy scheme", nil)
	}
	
	return nil
}
