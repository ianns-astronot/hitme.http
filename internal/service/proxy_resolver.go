package service

import (
	"fmt"
	"net/url"

	"hitme-http/internal/domain"
)

// ProxyResolver resolves proxy configuration
type ProxyResolver struct{}

// NewProxyResolver creates a new proxy resolver
func NewProxyResolver() *ProxyResolver {
	return &ProxyResolver{}
}

// ResolveProxy resolves the active proxy for a request
func (r *ProxyResolver) ResolveProxy(
	collectionProxies []*domain.ProxyConfig,
	activeProxyID *string,
	requestProxyOverrideID *string,
) (*domain.ProxyConfig, error) {
	// Priority: request override > collection active > none
	var targetID *string

	if requestProxyOverrideID != nil {
		targetID = requestProxyOverrideID
	} else if activeProxyID != nil {
		targetID = activeProxyID
	}

	if targetID == nil {
		return nil, nil // No proxy
	}

	// Find proxy by ID
	for _, proxy := range collectionProxies {
		if proxy.ID == *targetID {
			return proxy, nil
		}
	}

	return nil, domain.NewValidationError(fmt.Sprintf("proxy not found: %s", *targetID), nil)
}

// BuildProxyURL builds a proxy URL from proxy config
func (r *ProxyResolver) BuildProxyURL(proxyConfig *domain.ProxyConfig) (string, error) {
	if proxyConfig == nil {
		return "", nil
	}

	// Validate proxy config
	if proxyConfig.Host == "" {
		return "", domain.NewValidationError("proxy host is required", nil)
	}
	if proxyConfig.Port < 1 || proxyConfig.Port > 65535 {
		return "", domain.NewValidationError("invalid proxy port", nil)
	}

	// Build proxy URL
	proxyURL := &url.URL{
		Scheme: proxyConfig.Scheme,
		Host:   fmt.Sprintf("%s:%d", proxyConfig.Host, proxyConfig.Port),
	}

	// Add credentials if provided
	if proxyConfig.Username != nil && *proxyConfig.Username != "" {
		if proxyConfig.Password != nil {
			proxyURL.User = url.UserPassword(*proxyConfig.Username, *proxyConfig.Password)
		} else {
			proxyURL.User = url.User(*proxyConfig.Username)
		}
	}

	return proxyURL.String(), nil
}
