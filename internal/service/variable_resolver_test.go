package service

import (
	"testing"
)

func TestVariableResolver_Resolve_Simple(t *testing.T) {
	resolver := NewVariableResolver()
	variables := map[string]string{
		"baseUrl": "https://api.example.com",
		"version": "v1",
	}

	result, err := resolver.Resolve("{{baseUrl}}/{{version}}/users", variables)
	if err != nil {
		t.Fatalf("Failed to resolve: %v", err)
	}

	expected := "https://api.example.com/v1/users"
	if result != expected {
		t.Errorf("Expected %s, got %s", expected, result)
	}
}

func TestVariableResolver_Resolve_Nested(t *testing.T) {
	resolver := NewVariableResolver()
	variables := map[string]string{
		"env":     "prod",
		"baseUrl": "https://{{env}}.example.com",
	}

	result, err := resolver.Resolve("{{baseUrl}}/users", variables)
	if err != nil {
		t.Fatalf("Failed to resolve: %v", err)
	}

	expected := "https://prod.example.com/users"
	if result != expected {
		t.Errorf("Expected %s, got %s", expected, result)
	}
}

func TestVariableResolver_Resolve_Circular(t *testing.T) {
	resolver := NewVariableResolver()
	variables := map[string]string{
		"a": "{{b}}",
		"b": "{{a}}",
	}

	_, err := resolver.Resolve("{{a}}", variables)
	if err == nil {
		t.Error("Expected error for circular reference")
	}
}

func TestVariableResolver_Resolve_Unresolved(t *testing.T) {
	resolver := NewVariableResolver()
	variables := map[string]string{
		"baseUrl": "https://api.example.com",
	}

	_, err := resolver.Resolve("{{baseUrl}}/{{missing}}", variables)
	if err == nil {
		t.Error("Expected error for unresolved variable")
	}
}

func TestVariableResolver_FindPlaceholders(t *testing.T) {
	resolver := NewVariableResolver()
	template := "{{baseUrl}}/{{version}}/users?key={{apiKey}}"

	placeholders := resolver.FindPlaceholders(template)
	if len(placeholders) != 3 {
		t.Errorf("Expected 3 placeholders, got %d", len(placeholders))
	}

	expected := []string{"{{baseUrl}}", "{{version}}", "{{apiKey}}"}
	for i, placeholder := range placeholders {
		if placeholder != expected[i] {
			t.Errorf("Expected %s, got %s", expected[i], placeholder)
		}
	}
}

func TestVariableResolver_ValidatePlaceholders(t *testing.T) {
	resolver := NewVariableResolver()
	variables := map[string]string{
		"baseUrl": "https://api.example.com",
		"version": "v1",
	}

	template := "{{baseUrl}}/{{version}}/{{missing}}"
	unresolved := resolver.ValidatePlaceholders(template, variables)

	if len(unresolved) != 1 {
		t.Errorf("Expected 1 unresolved variable, got %d", len(unresolved))
	}
	if unresolved[0] != "missing" {
		t.Errorf("Expected 'missing', got %s", unresolved[0])
	}
}

func TestVariableResolver_Resolve_MaxDepth(t *testing.T) {
	resolver := NewVariableResolver()
	variables := map[string]string{
		"a": "{{b}}",
		"b": "{{c}}",
		"c": "{{d}}",
		"d": "{{e}}",
		"e": "{{f}}",
		"f": "{{g}}",
		"g": "{{h}}",
		"h": "{{i}}",
		"i": "{{j}}",
		"j": "{{k}}",
		"k": "{{l}}",
		"l": "value",
	}

	_, err := resolver.Resolve("{{a}}", variables)
	if err == nil {
		t.Error("Expected error for max depth exceeded")
	}
}

func TestVariableResolver_Resolve_NoPlaceholders(t *testing.T) {
	resolver := NewVariableResolver()
	variables := map[string]string{}

	result, err := resolver.Resolve("https://api.example.com/users", variables)
	if err != nil {
		t.Fatalf("Failed to resolve: %v", err)
	}

	expected := "https://api.example.com/users"
	if result != expected {
		t.Errorf("Expected %s, got %s", expected, result)
	}
}
