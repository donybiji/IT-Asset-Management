package main

import (
	"encoding/json"
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

func TestNormalizeStatus(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"available", StatusAvailable},
		{"Available", StatusAvailable},
		{"AVAILABLE", StatusAvailable},
		{"assigned", StatusAssigned},
		{"Assigned", StatusAssigned},
		{"ASSIGNED", StatusAssigned},
		{"under repair", StatusUnderRepair},
		{"Under Repair", StatusUnderRepair},
		{"UNDER_REPAIR", StatusUnderRepair},
		{"retired", StatusRetired},
		{"Retired", StatusRetired},
		{"RETIRED", StatusRetired},
		{"", StatusAvailable},
	}

	for _, tc := range tests {
		actual := normalizeStatus(tc.input)
		if actual != tc.expected {
			t.Errorf("normalizeStatus(%q) = %q; expected %q", tc.input, actual, tc.expected)
		}
	}
}

func TestAssetFieldsRequirement(t *testing.T) {
	assigned := "Alice Smith"
	asset := Asset{
		ID:           101,
		AssetCode:    "ASSET-101",
		AssetName:    "Dell Precision 5570",
		AssetType:    "Laptop",
		Category:     "Laptop",
		SerialNumber: "DELL-PREC-101",
		PurchaseDate: "2026-01-10",
		Status:       StatusAvailable,
		AssignedTo:   &assigned,
		Location:     "HQ Floor 4",
		CreatedAt:    "2026-01-10T10:00:00Z",
	}

	data, err := json.Marshal(asset)
	if err != nil {
		t.Fatalf("Failed to marshal Asset: %v", err)
	}

	var parsed map[string]interface{}
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("Failed to unmarshal Asset: %v", err)
	}

	// Verify all required fields from user specifications:
	// id, asset_code, asset_name, asset_type, serial_number, purchase_date, status, assigned_to, location
	requiredFields := []string{
		"id",
		"asset_code",
		"asset_name",
		"asset_type",
		"serial_number",
		"purchase_date",
		"status",
		"assigned_to",
		"location",
	}

	for _, field := range requiredFields {
		if _, exists := parsed[field]; !exists {
			t.Errorf("Required field %q missing from Asset JSON output", field)
		}
	}
}

func TestStatusConstantsRequirement(t *testing.T) {
	if StatusAvailable != "AVAILABLE" {
		t.Errorf("StatusAvailable = %q; expected 'AVAILABLE'", StatusAvailable)
	}
	if StatusAssigned != "ASSIGNED" {
		t.Errorf("StatusAssigned = %q; expected 'ASSIGNED'", StatusAssigned)
	}
	if StatusUnderRepair != "UNDER_REPAIR" {
		t.Errorf("StatusUnderRepair = %q; expected 'UNDER_REPAIR'", StatusUnderRepair)
	}
	if StatusRetired != "RETIRED" {
		t.Errorf("StatusRetired = %q; expected 'RETIRED'", StatusRetired)
	}
}

func TestPaginatedAssetsResponse(t *testing.T) {
	resp := PaginatedAssetsResponse{
		Data: []Asset{
			{ID: 1, AssetCode: "ASSET-01", AssetName: "Monitor", AssetType: "Monitor", Status: StatusAvailable},
		},
		Total:      25,
		Page:       1,
		Limit:      10,
		TotalPages: 3,
	}

	bytes, err := json.Marshal(resp)
	if err != nil {
		t.Fatalf("Failed to marshal PaginatedAssetsResponse: %v", err)
	}

	var parsed map[string]interface{}
	if err := json.Unmarshal(bytes, &parsed); err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	for _, k := range []string{"data", "total", "page", "limit", "total_pages"} {
		if _, exists := parsed[k]; !exists {
			t.Errorf("Missing pagination field %q in PaginatedAssetsResponse", k)
		}
	}
}
