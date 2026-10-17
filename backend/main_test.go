package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORSHandler(t *testing.T) {
	dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	cors := enableCORS(dummyHandler)

	// Test OPTIONS preflight
	reqOptions := httptest.NewRequest("OPTIONS", "/api/assets", nil)
	rrOptions := httptest.NewRecorder()
	cors(rrOptions, reqOptions)

	if rrOptions.Code != http.StatusOK {
		t.Errorf("Expected status 200 for OPTIONS, got %d", rrOptions.Code)
	}
	if rrOptions.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Errorf("Expected Access-Control-Allow-Origin: *")
	}

	// Test normal GET
	reqGet := httptest.NewRequest("GET", "/api/assets", nil)
	rrGet := httptest.NewRecorder()
	cors(rrGet, reqGet)

	if rrGet.Code != http.StatusOK {
		t.Errorf("Expected status 200 for GET, got %d", rrGet.Code)
	}
}
