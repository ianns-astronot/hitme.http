package transport

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"hitme-http/internal/domain"
)

// HTTPExecutor executes HTTP requests
type HTTPExecutor struct {
	client *http.Client
}

// NewHTTPExecutor creates a new HTTP executor
func NewHTTPExecutor() *HTTPExecutor {
	return &HTTPExecutor{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Execute executes an HTTP request
func (e *HTTPExecutor) Execute(request *domain.RequestNode) (*domain.ExecutionResult, error) {
	startTime := time.Now()

	// Build HTTP request
	httpReq, err := e.buildRequest(request)
	if err != nil {
		return nil, domain.NewValidationError("failed to build request", err)
	}

	// Execute request
	resp, err := e.client.Do(httpReq)
	if err != nil {
		return &domain.ExecutionResult{
			StatusCode:   0,
			StatusText:   "Request Failed",
			ResponseTime: time.Since(startTime).Milliseconds(),
			Error:        strPtr(err.Error()),
			Timestamp:    time.Now(),
		}, domain.NewNetworkError("request failed", err)
	}
	defer resp.Body.Close()

	// Read response body
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, domain.NewNetworkError("failed to read response body", err)
	}

	// Parse response headers
	headers := make(map[string]string)
	for key, values := range resp.Header {
		headers[key] = strings.Join(values, ", ")
	}

	// Calculate metrics
	responseTime := time.Since(startTime).Milliseconds()
	responseSize := int64(len(bodyBytes))

	result := &domain.ExecutionResult{
		StatusCode:      resp.StatusCode,
		StatusText:      resp.Status,
		ResponseTime:    responseTime,
		ResponseSize:    responseSize,
		ResponseHeaders: headers,
		ResponseBody:    string(bodyBytes),
		Error:           nil,
		Timestamp:       time.Now(),
	}

	return result, nil
}

// ExecuteWithConfig executes request with additional configuration (auth, proxy)
func (e *HTTPExecutor) ExecuteWithConfig(
	request *domain.RequestNode,
	authHeaders map[string]string,
	authQueryParams map[string]string,
	proxyURL string,
) (*domain.ExecutionResult, error) {
	startTime := time.Now()

	// Build HTTP request
	httpReq, err := e.buildRequestWithConfig(request, authHeaders, authQueryParams)
	if err != nil {
		return nil, domain.NewValidationError("failed to build request", err)
	}

	// Create client with proxy if provided
	client := e.client
	if proxyURL != "" {
		proxyURLParsed, err := url.Parse(proxyURL)
		if err != nil {
			return nil, domain.NewValidationError("invalid proxy URL", err)
		}
		transport := &http.Transport{
			Proxy: http.ProxyURL(proxyURLParsed),
		}
		client = &http.Client{
			Timeout:   e.client.Timeout,
			Transport: transport,
		}
	}

	// Execute request
	resp, err := client.Do(httpReq)
	if err != nil {
		return &domain.ExecutionResult{
			StatusCode:   0,
			StatusText:   "Request Failed",
			ResponseTime: time.Since(startTime).Milliseconds(),
			Error:        strPtr(err.Error()),
			Timestamp:    time.Now(),
		}, domain.NewNetworkError("request failed", err)
	}
	defer resp.Body.Close()

	// Read response body
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, domain.NewNetworkError("failed to read response body", err)
	}

	// Parse response headers
	headers := make(map[string]string)
	for key, values := range resp.Header {
		headers[key] = strings.Join(values, ", ")
	}

	// Calculate metrics
	responseTime := time.Since(startTime).Milliseconds()
	responseSize := int64(len(bodyBytes))

	result := &domain.ExecutionResult{
		StatusCode:      resp.StatusCode,
		StatusText:      resp.Status,
		ResponseTime:    responseTime,
		ResponseSize:    responseSize,
		ResponseHeaders: headers,
		ResponseBody:    string(bodyBytes),
		Error:           nil,
		Timestamp:       time.Now(),
	}

	return result, nil
}

// buildRequest builds an HTTP request from a RequestNode
func (e *HTTPExecutor) buildRequest(request *domain.RequestNode) (*http.Request, error) {
	return e.buildRequestWithConfig(request, nil, nil)
}

// buildRequestWithConfig builds an HTTP request with auth and query params
func (e *HTTPExecutor) buildRequestWithConfig(
	request *domain.RequestNode,
	authHeaders map[string]string,
	authQueryParams map[string]string,
) (*http.Request, error) {
	// Build URL with query params
	reqURL, err := e.buildURL(request.URL, request.QueryParams, authQueryParams)
	if err != nil {
		return nil, err
	}

	// Build body
	var bodyReader io.Reader
	if request.Body != nil {
		bodyReader, err = e.buildBody(request.Body)
		if err != nil {
			return nil, err
		}
	}

	// Create HTTP request
	httpReq, err := http.NewRequest(request.Method, reqURL, bodyReader)
	if err != nil {
		return nil, err
	}

	// Add headers
	e.addHeaders(httpReq, request.Headers)

	// Add auth headers
	if authHeaders != nil {
		for key, value := range authHeaders {
			httpReq.Header.Set(key, value)
		}
	}

	// Set default Content-Type if not provided
	if request.Body != nil && httpReq.Header.Get("Content-Type") == "" {
		switch request.Body.Type {
		case "json":
			httpReq.Header.Set("Content-Type", "application/json")
		case "form-urlencoded":
			httpReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		}
	}

	return httpReq, nil
}

// buildURL builds URL with query parameters
func (e *HTTPExecutor) buildURL(baseURL string, queryParams []*domain.KeyValueItem, authQueryParams map[string]string) (string, error) {
	parsedURL, err := url.Parse(baseURL)
	if err != nil {
		return "", err
	}

	q := parsedURL.Query()

	// Add request query params
	if queryParams != nil {
		for _, param := range queryParams {
			if param.Enabled && param.Key != "" {
				q.Add(param.Key, param.Value)
			}
		}
	}

	// Add auth query params
	if authQueryParams != nil {
		for key, value := range authQueryParams {
			q.Add(key, value)
		}
	}

	parsedURL.RawQuery = q.Encode()
	return parsedURL.String(), nil
}

// buildBody builds request body based on body config
func (e *HTTPExecutor) buildBody(body *domain.BodyConfig) (io.Reader, error) {
	switch body.Type {
	case "none":
		return nil, nil
	case "raw":
		return strings.NewReader(body.Content), nil
	case "json":
		// Validate JSON
		var js json.RawMessage
		if err := json.Unmarshal([]byte(body.Content), &js); err != nil {
			return nil, fmt.Errorf("invalid JSON: %w", err)
		}
		return strings.NewReader(body.Content), nil
	case "form-urlencoded":
		formData := url.Values{}
		if body.FormData != nil {
			for _, item := range body.FormData {
				if item.Enabled && item.Key != "" {
					formData.Add(item.Key, item.Value)
				}
			}
		}
		return strings.NewReader(formData.Encode()), nil
	default:
		return nil, fmt.Errorf("unsupported body type: %s", body.Type)
	}
}

// addHeaders adds headers to HTTP request
func (e *HTTPExecutor) addHeaders(req *http.Request, headers []*domain.KeyValueItem) {
	if headers == nil {
		return
	}

	for _, header := range headers {
		if header.Enabled && header.Key != "" {
			req.Header.Add(header.Key, header.Value)
		}
	}
}

// ExecuteWithTimeout executes request with custom timeout
func (e *HTTPExecutor) ExecuteWithTimeout(request *domain.RequestNode, timeout time.Duration) (*domain.ExecutionResult, error) {
	oldTimeout := e.client.Timeout
	e.client.Timeout = timeout
	defer func() { e.client.Timeout = oldTimeout }()

	return e.Execute(request)
}

func strPtr(s string) *string {
	return &s
}
