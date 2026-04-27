package service

import (
	"testing"

	"hitme-http/internal/domain"
)

func TestProxyResolver_ResolveProxy_RequestOverride(t *testing.T) {
	resolver := NewProxyResolver()
	
	proxy1ID := "proxy1"
	proxy2ID := "proxy2"
	
	proxies := []*domain.ProxyConfig{
		{ID: "proxy1", Name: "Proxy 1", Scheme: "http", Host: "proxy1.com", Port: 8080},
		{ID: "proxy2", Name: "Proxy 2", Scheme: "http", Host: "proxy2.com", Port: 8080},
	}

	// Request override should take priority
	proxy, err := resolver.ResolveProxy(proxies, &proxy1ID, &proxy2ID)
	if err != nil {
		t.Fatalf("Failed to resolve proxy: %v", err)
	}

	if proxy.ID != "proxy2" {
		t.Errorf("Expected proxy2, got %s", proxy.ID)
	}
}

func TestProxyResolver_ResolveProxy_CollectionActive(t *testing.T) {
	resolver := NewProxyResolver()
	
	proxy1ID := "proxy1"
	
	proxies := []*domain.ProxyConfig{
		{ID: "proxy1", Name: "Proxy 1", Scheme: "http", Host: "proxy1.com", Port: 8080},
	}

	// Should use collection active proxy
	proxy, err := resolver.ResolveProxy(proxies, &proxy1ID, nil)
	if err != nil {
		t.Fatalf("Failed to resolve proxy: %v", err)
	}

	if proxy.ID != "proxy1" {
		t.Errorf("Expected proxy1, got %s", proxy.ID)
	}
}

func TestProxyResolver_ResolveProxy_None(t *testing.T) {
	resolver := NewProxyResolver()
	
	proxies := []*domain.ProxyConfig{
		{ID: "proxy1", Name: "Proxy 1", Scheme: "http", Host: "proxy1.com", Port: 8080},
	}

	// Should return nil when no proxy is active
	proxy, err := resolver.ResolveProxy(proxies, nil, nil)
	if err != nil {
		t.Fatalf("Failed to resolve proxy: %v", err)
	}

	if proxy != nil {
		t.Error("Expected nil proxy")
	}
}

func TestProxyResolver_ResolveProxy_NotFound(t *testing.T) {
	resolver := NewProxyResolver()
	
	invalidID := "invalid"
	
	proxies := []*domain.ProxyConfig{
		{ID: "proxy1", Name: "Proxy 1", Scheme: "http", Host: "proxy1.com", Port: 8080},
	}

	// Should return error when proxy not found
	_, err := resolver.ResolveProxy(proxies, &invalidID, nil)
	if err == nil {
		t.Error("Expected error for proxy not found")
	}
}

func TestProxyResolver_BuildProxyURL_HTTP(t *testing.T) {
	resolver := NewProxyResolver()
	
	proxy := &domain.ProxyConfig{
		Scheme: "http",
		Host:   "proxy.example.com",
		Port:   8080,
	}

	url, err := resolver.BuildProxyURL(proxy)
	if err != nil {
		t.Fatalf("Failed to build proxy URL: %v", err)
	}

	expected := "http://proxy.example.com:8080"
	if url != expected {
		t.Errorf("Expected %s, got %s", expected, url)
	}
}

func TestProxyResolver_BuildProxyURL_WithCredentials(t *testing.T) {
	resolver := NewProxyResolver()
	
	username := "user"
	password := "pass"
	proxy := &domain.ProxyConfig{
		Scheme:   "http",
		Host:     "proxy.example.com",
		Port:     8080,
		Username: &username,
		Password: &password,
	}

	url, err := resolver.BuildProxyURL(proxy)
	if err != nil {
		t.Fatalf("Failed to build proxy URL: %v", err)
	}

	expected := "http://user:pass@proxy.example.com:8080"
	if url != expected {
		t.Errorf("Expected %s, got %s", expected, url)
	}
}

func TestProxyResolver_BuildProxyURL_Nil(t *testing.T) {
	resolver := NewProxyResolver()
	
	url, err := resolver.BuildProxyURL(nil)
	if err != nil {
		t.Fatalf("Failed to build proxy URL: %v", err)
	}

	if url != "" {
		t.Errorf("Expected empty string, got %s", url)
	}
}

func TestProxyResolver_BuildProxyURL_InvalidPort(t *testing.T) {
	resolver := NewProxyResolver()
	
	proxy := &domain.ProxyConfig{
		Scheme: "http",
		Host:   "proxy.example.com",
		Port:   99999,
	}

	_, err := resolver.BuildProxyURL(proxy)
	if err == nil {
		t.Error("Expected error for invalid port")
	}
}

func TestProxyResolver_BuildProxyURL_EmptyHost(t *testing.T) {
	resolver := NewProxyResolver()
	
	proxy := &domain.ProxyConfig{
		Scheme: "http",
		Host:   "",
		Port:   8080,
	}

	_, err := resolver.BuildProxyURL(proxy)
	if err == nil {
		t.Error("Expected error for empty host")
	}
}
