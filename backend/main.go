package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	_ "github.com/lib/pq"
)

// Standard Asset Statuses
const (
	StatusAvailable   = "AVAILABLE"
	StatusAssigned    = "ASSIGNED"
	StatusUnderRepair = "UNDER_REPAIR"
	StatusRetired     = "RETIRED"
)

type Asset struct {
	ID           int     `json:"id"`
	AssetCode    string  `json:"asset_code"`
	AssetName    string  `json:"asset_name"`
	AssetType    string  `json:"asset_type"`
	Category     string  `json:"category"`
	SerialNumber string  `json:"serial_number"`
	PurchaseDate string  `json:"purchase_date"`
	Status       string  `json:"status"`
	AssignedTo   *string `json:"assigned_to"`
	Location     string  `json:"location"`
	CreatedAt    string  `json:"created_at"`
}

type PaginatedAssetsResponse struct {
	Data       []Asset `json:"data"`
	Total      int     `json:"total"`
	Page       int     `json:"page"`
	Limit      int     `json:"limit"`
	TotalPages int     `json:"total_pages"`
}

type AssetHistory struct {
	ID         int     `json:"id"`
	AssetID    int     `json:"asset_id"`
	AssetCode  string  `json:"asset_code"`
	AssetName  string  `json:"asset_name"`
	ActionType string  `json:"action_type"`
	Employee   *string `json:"employee"`
	ActionDate string  `json:"action_date"`
	Notes      string  `json:"notes"`
}

type Employee struct {
	ID                  int    `json:"id"`
	Name                string `json:"name"`
	Email               string `json:"email"`
	Department          string `json:"department"`
	Role                string `json:"role"`
	AssignedAssetsCount int    `json:"assigned_assets_count"`
	CreatedAt           string `json:"created_at"`
}

type AssignRequest struct {
	AssetID  int    `json:"asset_id"`
	Employee string `json:"employee"`
	Notes    string `json:"notes"`
}

type ReturnRequest struct {
	AssetID int    `json:"asset_id"`
	Notes   string `json:"notes"`
}

type StatusChangeRequest struct {
	AssetID int    `json:"asset_id"`
	Notes   string `json:"notes"`
}

var db *sql.DB

func normalizeStatus(s string) string {
	cleaned := strings.ToUpper(strings.TrimSpace(s))
	cleaned = strings.ReplaceAll(cleaned, " ", "_")
	switch cleaned {
	case "AVAILABLE":
		return StatusAvailable
	case "ASSIGNED":
		return StatusAssigned
	case "UNDER_REPAIR", "UNDERREPAIR", "REPAIR":
		return StatusUnderRepair
	case "RETIRED":
		return StatusRetired
	default:
		if cleaned == "" {
			return StatusAvailable
		}
		return cleaned
	}
}

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With")
		w.Header().Set("Access-Control-Expose-Headers", "X-Total-Count, X-Page, X-Limit, X-Total-Pages")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With")
		w.Header().Set("Access-Control-Expose-Headers", "X-Total-Count, X-Page, X-Limit, X-Total-Pages")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func initDatabase() {
	_, err := db.Exec(`
		-- Ensure columns exist
		ALTER TABLE assets ADD COLUMN IF NOT EXISTS asset_type VARCHAR(50) DEFAULT '';
		ALTER TABLE assets ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT '';
		ALTER TABLE assets ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100) DEFAULT '';
		ALTER TABLE assets ADD COLUMN IF NOT EXISTS purchase_date VARCHAR(50) DEFAULT '';
		ALTER TABLE assets ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT '';
		
		-- Sync asset_type and category
		UPDATE assets SET asset_type = category WHERE (asset_type = '' OR asset_type IS NULL) AND category <> '';
		UPDATE assets SET category = asset_type WHERE (category = '' OR category IS NULL) AND asset_type <> '';

		-- Normalize existing statuses to canonical values
		UPDATE assets SET status = 'AVAILABLE' WHERE UPPER(status) = 'AVAILABLE';
		UPDATE assets SET status = 'ASSIGNED' WHERE UPPER(status) = 'ASSIGNED';
		UPDATE assets SET status = 'UNDER_REPAIR' WHERE UPPER(REPLACE(status, ' ', '_')) = 'UNDER_REPAIR';
		UPDATE assets SET status = 'RETIRED' WHERE UPPER(status) = 'RETIRED';

		-- Resolve any duplicate serial numbers in pre-existing test data
		UPDATE assets SET serial_number = 'LNV-TP-987568' WHERE id = 5 AND serial_number = 'LNV-TP-987567';

		-- Unique constraint/index for serial_number
		CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_serial_number ON assets (LOWER(TRIM(serial_number))) 
		WHERE serial_number IS NOT NULL AND serial_number <> '';

		CREATE TABLE IF NOT EXISTS asset_history (
			id SERIAL PRIMARY KEY,
			asset_id INT NOT NULL,
			asset_code VARCHAR(100) NOT NULL,
			asset_name VARCHAR(100) DEFAULT '',
			action_type VARCHAR(50) NOT NULL,
			employee VARCHAR(100),
			action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			notes TEXT
		);

		ALTER TABLE asset_history ADD COLUMN IF NOT EXISTS asset_name VARCHAR(100) DEFAULT '';
		CREATE INDEX IF NOT EXISTS idx_asset_history_asset_id ON asset_history(asset_id);
		CREATE INDEX IF NOT EXISTS idx_asset_history_asset_code ON asset_history(asset_code);
		CREATE INDEX IF NOT EXISTS idx_asset_history_action_type ON asset_history(action_type);
		CREATE INDEX IF NOT EXISTS idx_asset_history_action_date ON asset_history(action_date DESC);

		CREATE TABLE IF NOT EXISTS employees (
			id SERIAL PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			email VARCHAR(100) NOT NULL UNIQUE,
			department VARCHAR(50),
			role VARCHAR(50),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);

		CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(LOWER(name));
		CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department);
	`)
	if err != nil {
		log.Printf("DB migration note: %v\n", err)
	}

	// Backfill any missing asset_name in history
	_, _ = db.Exec(`
		UPDATE asset_history h
		SET asset_name = a.asset_name
		FROM assets a
		WHERE h.asset_id = a.id AND (h.asset_name = '' OR h.asset_name IS NULL);
	`)

	// Ensure seed details for existing rows
	_, _ = db.Exec(`
		UPDATE assets SET 
			asset_type = CASE WHEN asset_type = '' OR asset_type IS NULL THEN 'Laptop' ELSE asset_type END,
			category = CASE WHEN category = '' OR category IS NULL THEN 'Laptop' ELSE category END,
			serial_number = CASE WHEN serial_number = '' OR serial_number IS NULL THEN 'MBP14-2024-001' ELSE serial_number END,
			purchase_date = CASE WHEN purchase_date = '' OR purchase_date IS NULL THEN '2024-01-15' ELSE purchase_date END,
			location = CASE WHEN location = '' OR location IS NULL THEN 'Floor 3 - Desk 302' ELSE location END
		WHERE asset_code = 'ASSET-001';

		UPDATE assets SET 
			asset_type = CASE WHEN asset_type = '' OR asset_type IS NULL THEN 'Laptop' ELSE asset_type END,
			category = CASE WHEN category = '' OR category IS NULL THEN 'Laptop' ELSE category END,
			serial_number = CASE WHEN serial_number = '' OR serial_number IS NULL THEN 'DELL-LAT-5540-X1' ELSE serial_number END,
			purchase_date = CASE WHEN purchase_date = '' OR purchase_date IS NULL THEN '2024-05-10' ELSE purchase_date END,
			location = CASE WHEN location = '' OR location IS NULL THEN 'Engineering Hub - Room 204' ELSE location END
		WHERE asset_code = 'ASSET-003';
	`)

	// Seed initial employees if empty
	var employeeCount int
	_ = db.QueryRow("SELECT COUNT(*) FROM employees").Scan(&employeeCount)
	if employeeCount == 0 {
		_, _ = db.Exec(`
			INSERT INTO employees (name, email, department, role) VALUES
			('John Doe', 'john.doe@company.com', 'Engineering', 'Senior Developer'),
			('Jane Smith', 'jane.smith@company.com', 'Product', 'Product Manager'),
			('Alex Johnson', 'alex.j@company.com', 'Operations', 'System Admin'),
			('Sarah Williams', 'sarah.w@company.com', 'Design', 'UI/UX Lead'),
			('Michael Brown', 'm.brown@company.com', 'Finance', 'Financial Analyst')
			ON CONFLICT (email) DO NOTHING;
		`)
	}

	// Seed initial history if empty
	var historyCount int
	_ = db.QueryRow("SELECT COUNT(*) FROM asset_history").Scan(&historyCount)
	if historyCount == 0 {
		_, _ = db.Exec(`
			INSERT INTO asset_history (asset_id, asset_code, asset_name, action_type, employee, action_date, notes)
			VALUES 
			(1, 'ASSET-001', 'MacBook Pro 14"', 'Created', NULL, NOW() - INTERVAL '30 days', 'Initial asset inventory setup'),
			(1, 'ASSET-001', 'MacBook Pro 14"', 'Assigned', 'John Doe', NOW() - INTERVAL '15 days', 'Standard workstation allocation'),
			(3, 'ASSET-003', 'Dell Latitude 5540', 'Created', NULL, NOW() - INTERVAL '20 days', 'Secondary workstation procurement');
		`)
	}
}

func logHistory(assetID int, assetCode, actionType string, employee *string, notes string) {
	var assetName string
	_ = db.QueryRow("SELECT asset_name FROM assets WHERE id = $1", assetID).Scan(&assetName)

	_, err := db.Exec(`
		INSERT INTO asset_history (asset_id, asset_code, asset_name, action_type, employee, notes)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, assetID, assetCode, assetName, actionType, employee, notes)
	if err != nil {
		log.Printf("Failed to log history: %v\n", err)
	}
}

func handleAssets(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		getAssets(w, r)
	case "POST":
		createAsset(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getAssets(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Parse query parameters for search, filtering, and pagination
	search := strings.TrimSpace(r.URL.Query().Get("search"))
	status := strings.TrimSpace(r.URL.Query().Get("status"))
	assetType := strings.TrimSpace(r.URL.Query().Get("asset_type"))
	if assetType == "" {
		assetType = strings.TrimSpace(r.URL.Query().Get("category"))
	}
	assignedTo := strings.TrimSpace(r.URL.Query().Get("assigned_to"))

	pageStr := strings.TrimSpace(r.URL.Query().Get("page"))
	limitStr := strings.TrimSpace(r.URL.Query().Get("limit"))
	format := strings.TrimSpace(r.URL.Query().Get("format"))

	var conditions []string
	var args []interface{}
	argIdx := 1

	// Search filter: asset_code, serial_number, asset_name, location, assigned_to
	if search != "" {
		pat := "%" + strings.ToLower(search) + "%"
		conditions = append(conditions, fmt.Sprintf(`(
			LOWER(asset_code) LIKE $%d OR 
			LOWER(COALESCE(serial_number, '')) LIKE $%d OR 
			LOWER(asset_name) LIKE $%d OR 
			LOWER(COALESCE(location, '')) LIKE $%d OR
			LOWER(COALESCE(assigned_to, '')) LIKE $%d
		)`, argIdx, argIdx, argIdx, argIdx, argIdx))
		args = append(args, pat)
		argIdx++
	}

	// Status filter
	if status != "" && strings.ToUpper(status) != "ALL" {
		canonicalStatus := normalizeStatus(status)
		conditions = append(conditions, fmt.Sprintf("UPPER(REPLACE(status, ' ', '_')) = $%d", argIdx))
		args = append(args, canonicalStatus)
		argIdx++
	}

	// Asset Type filter
	if assetType != "" && strings.ToUpper(assetType) != "ALL" {
		conditions = append(conditions, fmt.Sprintf("(LOWER(COALESCE(NULLIF(asset_type, ''), category, '')) = LOWER($%d))", argIdx))
		args = append(args, assetType)
		argIdx++
	}

	// Assigned To filter
	if assignedTo != "" {
		conditions = append(conditions, fmt.Sprintf("LOWER(COALESCE(assigned_to, '')) = LOWER($%d)", argIdx))
		args = append(args, assignedTo)
		argIdx++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = " WHERE " + strings.Join(conditions, " AND ")
	}

	// Count total records matching filters
	var total int
	countQuery := "SELECT COUNT(*) FROM assets" + whereClause
	if err := db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		http.Error(w, "Failed to count assets: "+err.Error(), http.StatusInternalServerError)
		return
	}

	isPaginated := pageStr != "" || limitStr != "" || format == "paginated"
	page := 1
	limit := 10

	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	totalPages := 1
	if limit > 0 {
		totalPages = (total + limit - 1) / limit
		if totalPages == 0 {
			totalPages = 1
		}
	}

	selectQuery := fmt.Sprintf(`
		SELECT id, asset_name, asset_code, 
		       COALESCE(NULLIF(asset_type, ''), category, '') as asset_type,
		       COALESCE(category, asset_type, '') as category,
		       status, assigned_to, 
		       COALESCE(serial_number, '') as serial_number, 
		       COALESCE(purchase_date, '') as purchase_date, 
		       COALESCE(location, '') as location, 
		       created_at 
		FROM assets 
		%s
		ORDER BY id ASC
	`, whereClause)

	if isPaginated {
		offset := (page - 1) * limit
		selectQuery += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
		args = append(args, limit, offset)
	}

	rows, err := db.Query(selectQuery, args...)
	if err != nil {
		http.Error(w, "Failed to query assets: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var assets []Asset
	for rows.Next() {
		var a Asset
		if err := rows.Scan(&a.ID, &a.AssetName, &a.AssetCode, &a.AssetType, &a.Category, &a.Status, &a.AssignedTo, &a.SerialNumber, &a.PurchaseDate, &a.Location, &a.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		a.Status = normalizeStatus(a.Status)
		assets = append(assets, a)
	}
	if assets == nil {
		assets = []Asset{}
	}

	w.Header().Set("X-Total-Count", strconv.Itoa(total))
	w.Header().Set("X-Page", strconv.Itoa(page))
	w.Header().Set("X-Limit", strconv.Itoa(limit))
	w.Header().Set("X-Total-Pages", strconv.Itoa(totalPages))

	if isPaginated && (pageStr != "" || format == "paginated") {
		json.NewEncoder(w).Encode(PaginatedAssetsResponse{
			Data:       assets,
			Total:      total,
			Page:       page,
			Limit:      limit,
			TotalPages: totalPages,
		})
	} else {
		json.NewEncoder(w).Encode(assets)
	}
}

func createAsset(w http.ResponseWriter, r *http.Request) {
	var a Asset
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		http.Error(w, "Invalid request payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	a.AssetName = strings.TrimSpace(a.AssetName)
	a.AssetCode = strings.TrimSpace(a.AssetCode)
	a.AssetType = strings.TrimSpace(a.AssetType)
	a.Category = strings.TrimSpace(a.Category)
	a.SerialNumber = strings.TrimSpace(a.SerialNumber)
	a.PurchaseDate = strings.TrimSpace(a.PurchaseDate)
	a.Location = strings.TrimSpace(a.Location)

	if a.AssetType == "" && a.Category != "" {
		a.AssetType = a.Category
	}
	if a.Category == "" && a.AssetType != "" {
		a.Category = a.AssetType
	}

	if a.AssetName == "" || a.AssetCode == "" {
		http.Error(w, "Asset Name and Asset Code are required", http.StatusBadRequest)
		return
	}

	if a.AssetType == "" {
		http.Error(w, "Asset Type is required", http.StatusBadRequest)
		return
	}

	if a.SerialNumber == "" {
		http.Error(w, "Serial Number is required", http.StatusBadRequest)
		return
	}

	// Normalize initial status to canonical value
	a.Status = normalizeStatus(a.Status)

	// Business Rule: Asset code should be unique
	var codeExists bool
	_ = db.QueryRow("SELECT EXISTS(SELECT 1 FROM assets WHERE LOWER(TRIM(asset_code)) = LOWER(TRIM($1)))", a.AssetCode).Scan(&codeExists)
	if codeExists {
		http.Error(w, fmt.Sprintf("Asset code '%s' already exists in inventory", a.AssetCode), http.StatusConflict)
		return
	}

	// Business Rule: Serial number should be unique
	var snExists bool
	_ = db.QueryRow("SELECT EXISTS(SELECT 1 FROM assets WHERE LOWER(TRIM(serial_number)) = LOWER(TRIM($1)))", a.SerialNumber).Scan(&snExists)
	if snExists {
		http.Error(w, fmt.Sprintf("Serial number '%s' already exists in inventory", a.SerialNumber), http.StatusConflict)
		return
	}

	// If assigned_to is supplied, check if status allows assignment
	if a.AssignedTo != nil && strings.TrimSpace(*a.AssignedTo) != "" {
		if a.Status != StatusAvailable && a.Status != StatusAssigned {
			http.Error(w, fmt.Sprintf("Cannot assign asset when status is '%s'. Only AVAILABLE assets can be assigned.", a.Status), http.StatusBadRequest)
			return
		}
		a.Status = StatusAssigned
	} else if a.Status == StatusAssigned {
		http.Error(w, "Cannot create an asset with ASSIGNED status without specifying assigned_to employee", http.StatusBadRequest)
		return
	}

	err := db.QueryRow(`
		INSERT INTO assets (asset_name, asset_code, asset_type, category, status, assigned_to, serial_number, purchase_date, location)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at
	`, a.AssetName, a.AssetCode, a.AssetType, a.Category, a.Status, a.AssignedTo, a.SerialNumber, a.PurchaseDate, a.Location).Scan(&a.ID, &a.CreatedAt)

	if err != nil {
		http.Error(w, "Failed to create asset: "+err.Error(), http.StatusInternalServerError)
		return
	}

	logHistory(a.ID, a.AssetCode, "Created", a.AssignedTo, "Asset registered into inventory")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(a)
}

func handleAssetByID(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/assets/")
	parts := strings.Split(path, "/")

	if len(parts) == 0 || parts[0] == "" {
		handleAssets(w, r)
		return
	}

	// Handle /api/assets/assign
	if parts[0] == "assign" && r.Method == "POST" {
		var req AssignRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid payload", http.StatusBadRequest)
			return
		}
		assignAssetLogic(w, req.AssetID, req.Employee, req.Notes)
		return
	}

	// Handle /api/assets/return
	if parts[0] == "return" && r.Method == "POST" {
		var req ReturnRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid payload", http.StatusBadRequest)
			return
		}
		returnAssetLogic(w, req.AssetID, req.Notes)
		return
	}

	// Handle /api/assets/repair
	if parts[0] == "repair" && (r.Method == "POST" || r.Method == "PUT") {
		var req StatusChangeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid payload", http.StatusBadRequest)
			return
		}
		changeAssetStatus(w, req.AssetID, StatusUnderRepair, req.Notes)
		return
	}

	// Handle /api/assets/retire
	if parts[0] == "retire" && (r.Method == "POST" || r.Method == "PUT") {
		var req StatusChangeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid payload", http.StatusBadRequest)
			return
		}
		changeAssetStatus(w, req.AssetID, StatusRetired, req.Notes)
		return
	}

	id, err := strconv.Atoi(parts[0])
	if err != nil {
		http.Error(w, "Invalid asset ID", http.StatusBadRequest)
		return
	}

	// Check sub-actions e.g. /api/assets/:id/assign
	if len(parts) > 1 && parts[1] != "" {
		sub := parts[1]
		switch sub {
		case "assign":
			if r.Method != "POST" {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
				return
			}
			var req AssignRequest
			_ = json.NewDecoder(r.Body).Decode(&req)
			assignAssetLogic(w, id, req.Employee, req.Notes)
			return
		case "return":
			if r.Method != "POST" {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
				return
			}
			var req ReturnRequest
			_ = json.NewDecoder(r.Body).Decode(&req)
			returnAssetLogic(w, id, req.Notes)
			return
		case "repair":
			note := "Asset sent for maintenance / repair"
			if r.Body != nil {
				var req StatusChangeRequest
				_ = json.NewDecoder(r.Body).Decode(&req)
				if strings.TrimSpace(req.Notes) != "" {
					note = strings.TrimSpace(req.Notes)
				}
			}
			changeAssetStatus(w, id, StatusUnderRepair, note)
			return
		case "retire":
			note := "Asset decommissioned and retired"
			if r.Body != nil {
				var req StatusChangeRequest
				_ = json.NewDecoder(r.Body).Decode(&req)
				if strings.TrimSpace(req.Notes) != "" {
					note = strings.TrimSpace(req.Notes)
				}
			}
			changeAssetStatus(w, id, StatusRetired, note)
			return
		case "available":
			note := "Asset restored to available stock"
			changeAssetStatus(w, id, StatusAvailable, note)
			return
		case "history":
			// GET /api/assets/:id/history
			getAssetHistoryByID(w, id)
			return
		default:
			http.Error(w, "Unknown action", http.StatusNotFound)
			return
		}
	}

	switch r.Method {
	case "GET":
		getAssetByID(w, id)
	case "PUT":
		updateAsset(w, r, id)
	case "DELETE":
		deleteAsset(w, id)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getAssetByID(w http.ResponseWriter, id int) {
	var a Asset
	err := db.QueryRow(`
		SELECT id, asset_name, asset_code, 
		       COALESCE(NULLIF(asset_type, ''), category, '') as asset_type,
		       COALESCE(category, asset_type, '') as category,
		       status, assigned_to, 
		       COALESCE(serial_number, '') as serial_number, 
		       COALESCE(purchase_date, '') as purchase_date, 
		       COALESCE(location, '') as location, 
		       created_at 
		FROM assets WHERE id = $1
	`, id).Scan(&a.ID, &a.AssetName, &a.AssetCode, &a.AssetType, &a.Category, &a.Status, &a.AssignedTo, &a.SerialNumber, &a.PurchaseDate, &a.Location, &a.CreatedAt)

	if err == sql.ErrNoRows {
		http.Error(w, "Asset not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	a.Status = normalizeStatus(a.Status)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(a)
}

func updateAsset(w http.ResponseWriter, r *http.Request, id int) {
	var a Asset
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	var currentCode, currentName string
	err := db.QueryRow("SELECT asset_code, asset_name FROM assets WHERE id = $1", id).Scan(&currentCode, &currentName)
	if err == sql.ErrNoRows {
		http.Error(w, "Asset not found", http.StatusNotFound)
		return
	}

	a.AssetName = strings.TrimSpace(a.AssetName)
	a.AssetCode = strings.TrimSpace(a.AssetCode)
	a.AssetType = strings.TrimSpace(a.AssetType)
	a.Category = strings.TrimSpace(a.Category)
	a.SerialNumber = strings.TrimSpace(a.SerialNumber)
	a.PurchaseDate = strings.TrimSpace(a.PurchaseDate)
	a.Location = strings.TrimSpace(a.Location)

	if a.AssetCode == "" {
		a.AssetCode = currentCode
	}
	if a.AssetType == "" && a.Category != "" {
		a.AssetType = a.Category
	}
	if a.Category == "" && a.AssetType != "" {
		a.Category = a.AssetType
	}

	if a.AssetName == "" {
		http.Error(w, "Asset Name is required", http.StatusBadRequest)
		return
	}
	if a.AssetType == "" {
		http.Error(w, "Asset Type is required", http.StatusBadRequest)
		return
	}
	if a.SerialNumber == "" {
		http.Error(w, "Serial Number is required", http.StatusBadRequest)
		return
	}

	// Business Rule: Asset code should be unique
	var codeExists bool
	_ = db.QueryRow("SELECT EXISTS(SELECT 1 FROM assets WHERE LOWER(TRIM(asset_code)) = LOWER(TRIM($1)) AND id <> $2)", a.AssetCode, id).Scan(&codeExists)
	if codeExists {
		http.Error(w, fmt.Sprintf("Asset code '%s' already exists on another asset", a.AssetCode), http.StatusConflict)
		return
	}

	// Business Rule: Serial number should be unique
	var snExists bool
	_ = db.QueryRow("SELECT EXISTS(SELECT 1 FROM assets WHERE LOWER(TRIM(serial_number)) = LOWER(TRIM($1)) AND id <> $2)", a.SerialNumber, id).Scan(&snExists)
	if snExists {
		http.Error(w, fmt.Sprintf("Serial number '%s' already exists on another asset", a.SerialNumber), http.StatusConflict)
		return
	}

	a.Status = normalizeStatus(a.Status)
	if a.Status != StatusAssigned {
		a.AssignedTo = nil
	}

	_, err = db.Exec(`
		UPDATE assets 
		SET asset_name = $1, asset_code = $2, asset_type = $3, category = $4, serial_number = $5, purchase_date = $6, location = $7, status = $8, assigned_to = $9
		WHERE id = $10
	`, a.AssetName, a.AssetCode, a.AssetType, a.Category, a.SerialNumber, a.PurchaseDate, a.Location, a.Status, a.AssignedTo, id)

	if err != nil {
		http.Error(w, "Failed to update asset: "+err.Error(), http.StatusInternalServerError)
		return
	}

	notes := "Asset details updated"
	logHistory(id, a.AssetCode, "Updated", a.AssignedTo, notes)

	getAssetByID(w, id)
}

func deleteAsset(w http.ResponseWriter, id int) {
	var code string
	err := db.QueryRow("SELECT asset_code FROM assets WHERE id = $1", id).Scan(&code)
	if err == sql.ErrNoRows {
		http.Error(w, "Asset not found", http.StatusNotFound)
		return
	}

	_, _ = db.Exec("DELETE FROM asset_history WHERE asset_id = $1", id)
	_, err = db.Exec("DELETE FROM assets WHERE id = $1", id)
	if err != nil {
		http.Error(w, "Failed to delete asset: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Asset %s deleted successfully", code),
	})
}

// Business Rules for Assigning Assets:
// 1. An asset cannot be assigned if it is already assigned.
// 2. A retired asset cannot be assigned.
// 3. An asset under repair cannot be assigned.
func assignAssetLogic(w http.ResponseWriter, id int, employee, notes string) {
	employee = strings.TrimSpace(employee)
	if employee == "" {
		http.Error(w, "Employee recipient is required for assignment", http.StatusBadRequest)
		return
	}

	// Begin atomic transaction
	tx, err := db.Begin()
	if err != nil {
		http.Error(w, "Database transaction error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	var code, currentStatus, currentName string
	var currentAssignedTo *string
	err = tx.QueryRow("SELECT asset_name, asset_code, status, assigned_to FROM assets WHERE id = $1 FOR UPDATE", id).Scan(&currentName, &code, &currentStatus, &currentAssignedTo)
	if err == sql.ErrNoRows {
		http.Error(w, fmt.Sprintf("Asset with ID %d not found in inventory", id), http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	currentStatusNorm := normalizeStatus(currentStatus)

	// Enforce strict business rules
	switch currentStatusNorm {
	case StatusAssigned:
		assignedHolder := "another employee"
		if currentAssignedTo != nil && *currentAssignedTo != "" {
			assignedHolder = *currentAssignedTo
		}
		http.Error(w, fmt.Sprintf("Business Rule Violation: An asset cannot be assigned if it is already assigned. Asset '%s' is currently assigned to %s.", code, assignedHolder), http.StatusConflict)
		return
	case StatusRetired:
		http.Error(w, fmt.Sprintf("Business Rule Violation: A retired asset cannot be assigned. Asset '%s' has been decommissioned and retired.", code), http.StatusConflict)
		return
	case StatusUnderRepair:
		http.Error(w, fmt.Sprintf("Business Rule Violation: An asset under repair cannot be assigned. Asset '%s' is currently under repair.", code), http.StatusConflict)
		return
	case StatusAvailable:
		// Eligible for assignment
	default:
		http.Error(w, fmt.Sprintf("Allocation Conflict: Asset '%s' has status '%s' and cannot be assigned. Only '%s' assets can be allocated.", code, currentStatus, StatusAvailable), http.StatusConflict)
		return
	}

	// Update asset status to ASSIGNED
	_, err = tx.Exec("UPDATE assets SET status = $1, assigned_to = $2 WHERE id = $3", StatusAssigned, employee, id)
	if err != nil {
		http.Error(w, "Failed to update asset assignment: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Ensure employee exists in employees table (auto-create if newly specified)
	var empExists bool
	_ = tx.QueryRow("SELECT EXISTS(SELECT 1 FROM employees WHERE LOWER(name) = LOWER($1))", employee).Scan(&empExists)
	if !empExists {
		email := fmt.Sprintf("%s@company.com", strings.ToLower(strings.ReplaceAll(employee, " ", ".")))
		_, _ = tx.Exec("INSERT INTO employees (name, email, department, role) VALUES ($1, $2, 'General Staff', 'Team Member') ON CONFLICT (email) DO NOTHING", employee, email)
	}

	// Record audit history
	historyNotes := strings.TrimSpace(notes)
	if historyNotes == "" {
		historyNotes = fmt.Sprintf("Assigned to staff member: %s", employee)
	}
	_, err = tx.Exec(`
		INSERT INTO asset_history (asset_id, asset_code, asset_name, action_type, employee, notes)
		VALUES ($1, $2, $3, 'Assigned', $4, $5)
	`, id, code, currentName, employee, historyNotes)
	if err != nil {
		http.Error(w, "Failed to record allocation audit log: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if err = tx.Commit(); err != nil {
		http.Error(w, "Failed to commit assignment transaction: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":     true,
		"message":     fmt.Sprintf("Asset %s successfully assigned to %s", code, employee),
		"asset_id":    id,
		"asset_code":  code,
		"asset_name":  currentName,
		"status":      StatusAssigned,
		"assigned_to": employee,
	})
}

// Business Rule: Returning an asset should create an asset history record.
func returnAssetLogic(w http.ResponseWriter, id int, notes string) {
	tx, err := db.Begin()
	if err != nil {
		http.Error(w, "Database transaction error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	var code, currentName, status string
	var assignedTo *string
	err = tx.QueryRow("SELECT asset_code, asset_name, status, assigned_to FROM assets WHERE id = $1 FOR UPDATE", id).Scan(&code, &currentName, &status, &assignedTo)
	if err == sql.ErrNoRows {
		http.Error(w, "Asset not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	statusNorm := normalizeStatus(status)
	if statusNorm != StatusAssigned {
		http.Error(w, fmt.Sprintf("Cannot return asset %s: it is currently '%s' and is not assigned to any staff member.", code, status), http.StatusBadRequest)
		return
	}

	// Update asset status to AVAILABLE and clear assigned_to
	_, err = tx.Exec("UPDATE assets SET status = $1, assigned_to = NULL WHERE id = $2", StatusAvailable, id)
	if err != nil {
		http.Error(w, "Failed to return asset: "+err.Error(), http.StatusInternalServerError)
		return
	}

	historyNotes := strings.TrimSpace(notes)
	if historyNotes == "" {
		prev := "Staff Member"
		if assignedTo != nil && *assignedTo != "" {
			prev = *assignedTo
		}
		historyNotes = fmt.Sprintf("Returned by %s into available inventory", prev)
	}

	// Business Rule: Returning an asset should create an asset history record.
	_, err = tx.Exec(`
		INSERT INTO asset_history (asset_id, asset_code, asset_name, action_type, employee, notes)
		VALUES ($1, $2, $3, 'Returned', $4, $5)
	`, id, code, currentName, assignedTo, historyNotes)
	if err != nil {
		http.Error(w, "Failed to log return history: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if err = tx.Commit(); err != nil {
		http.Error(w, "Failed to commit return transaction: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"message":    fmt.Sprintf("Asset %s successfully returned to available inventory", code),
		"asset_id":   id,
		"asset_code": code,
		"status":     StatusAvailable,
	})
}

func changeAssetStatus(w http.ResponseWriter, id int, newStatus, defaultNote string) {
	canonicalStatus := normalizeStatus(newStatus)

	var code, currentName string
	var assignedTo *string
	err := db.QueryRow("SELECT asset_code, asset_name, assigned_to FROM assets WHERE id = $1", id).Scan(&code, &currentName, &assignedTo)
	if err == sql.ErrNoRows {
		http.Error(w, "Asset not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// If moving to Under Repair or Retired, clear assigned_to
	if canonicalStatus == StatusUnderRepair || canonicalStatus == StatusRetired || canonicalStatus == StatusAvailable {
		_, err = db.Exec("UPDATE assets SET status = $1, assigned_to = NULL WHERE id = $2", canonicalStatus, id)
	} else {
		_, err = db.Exec("UPDATE assets SET status = $1 WHERE id = $2", canonicalStatus, id)
	}

	if err != nil {
		http.Error(w, "Failed to update asset status: "+err.Error(), http.StatusInternalServerError)
		return
	}

	actionType := "Updated"
	switch canonicalStatus {
	case StatusUnderRepair:
		actionType = "Under Repair"
		if defaultNote == "" {
			defaultNote = "Asset marked for maintenance / diagnosis"
		}
	case StatusRetired:
		actionType = "Retired"
		if defaultNote == "" {
			defaultNote = "Asset decommissioned and retired"
		}
	case StatusAvailable:
		actionType = "Returned"
		if defaultNote == "" {
			defaultNote = "Asset restored to available stock"
		}
	}

	_, _ = db.Exec(`
		INSERT INTO asset_history (asset_id, asset_code, asset_name, action_type, employee, notes)
		VALUES ($1, $2, $3, $4, $5, $5)
	`, id, code, currentName, actionType, assignedTo, defaultNote)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"message":    fmt.Sprintf("Asset %s status updated to '%s'", code, canonicalStatus),
		"asset_id":   id,
		"asset_code": code,
		"status":     canonicalStatus,
	})
}

func getAssetHistoryByID(w http.ResponseWriter, assetID int) {
	w.Header().Set("Content-Type", "application/json")

	rows, err := db.Query(`
		SELECT h.id, h.asset_id, h.asset_code, 
		       COALESCE(NULLIF(h.asset_name, ''), a.asset_name, '') as asset_name,
		       h.action_type, h.employee, h.action_date, COALESCE(h.notes, '') as notes
		FROM asset_history h
		LEFT JOIN assets a ON h.asset_id = a.id
		WHERE h.asset_id = $1
		ORDER BY h.action_date DESC, h.id DESC
	`, assetID)
	if err != nil {
		http.Error(w, "Failed to query asset history: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var history []AssetHistory
	for rows.Next() {
		var h AssetHistory
		if err := rows.Scan(&h.ID, &h.AssetID, &h.AssetCode, &h.AssetName, &h.ActionType, &h.Employee, &h.ActionDate, &h.Notes); err != nil {
			http.Error(w, "Failed to scan history: "+err.Error(), http.StatusInternalServerError)
			return
		}
		history = append(history, h)
	}
	if history == nil {
		history = []AssetHistory{}
	}

	json.NewEncoder(w).Encode(history)
}

func handleEmployees(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		getEmployees(w, r)
	case "POST":
		createEmployee(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func handleEmployeeByID(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/employees/")
	parts := strings.Split(path, "/")
	if len(parts) == 0 || parts[0] == "" {
		handleEmployees(w, r)
		return
	}

	id, err := strconv.Atoi(parts[0])
	if err != nil {
		http.Error(w, "Invalid employee ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case "GET":
		getEmployeeByID(w, id)
	case "PUT":
		updateEmployee(w, r, id)
	case "DELETE":
		deleteEmployee(w, id)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getEmployees(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	search := strings.TrimSpace(r.URL.Query().Get("search"))
	dept := strings.TrimSpace(r.URL.Query().Get("department"))

	var conditions []string
	var args []interface{}
	argIdx := 1

	if dept != "" && strings.ToUpper(dept) != "ALL" {
		conditions = append(conditions, fmt.Sprintf("LOWER(e.department) = LOWER($%d)", argIdx))
		args = append(args, dept)
		argIdx++
	}

	if search != "" {
		pat := "%" + strings.ToLower(search) + "%"
		conditions = append(conditions, fmt.Sprintf("(LOWER(e.name) LIKE $%d OR LOWER(e.email) LIKE $%d OR LOWER(COALESCE(e.department, '')) LIKE $%d OR LOWER(COALESCE(e.role, '')) LIKE $%d)", argIdx, argIdx, argIdx, argIdx))
		args = append(args, pat)
		argIdx++
	}

	query := `
		SELECT e.id, e.name, e.email, 
		       COALESCE(e.department, 'General Staff') as department, 
		       COALESCE(e.role, 'Team Member') as role, 
		       COALESCE(e.created_at::text, '') as created_at,
		       COUNT(CASE WHEN UPPER(REPLACE(a.status, ' ', '_')) = 'ASSIGNED' THEN 1 END) as assigned_assets_count
		FROM employees e
		LEFT JOIN assets a ON LOWER(TRIM(a.assigned_to)) = LOWER(TRIM(e.name))
	`
	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += " GROUP BY e.id, e.name, e.email, e.department, e.role, e.created_at ORDER BY e.name ASC"

	rows, err := db.Query(query, args...)
	if err != nil {
		http.Error(w, "Failed to query employees: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var employees []Employee
	for rows.Next() {
		var e Employee
		if err := rows.Scan(&e.ID, &e.Name, &e.Email, &e.Department, &e.Role, &e.CreatedAt, &e.AssignedAssetsCount); err != nil {
			http.Error(w, "Failed to scan employee: "+err.Error(), http.StatusInternalServerError)
			return
		}
		employees = append(employees, e)
	}
	if employees == nil {
		employees = []Employee{}
	}

	json.NewEncoder(w).Encode(employees)
}

func getEmployeeByID(w http.ResponseWriter, id int) {
	var e Employee
	err := db.QueryRow(`
		SELECT e.id, e.name, e.email, 
		       COALESCE(e.department, 'General Staff') as department, 
		       COALESCE(e.role, 'Team Member') as role, 
		       COALESCE(e.created_at::text, '') as created_at,
		       COUNT(CASE WHEN UPPER(REPLACE(a.status, ' ', '_')) = 'ASSIGNED' THEN 1 END) as assigned_assets_count
		FROM employees e
		LEFT JOIN assets a ON LOWER(TRIM(a.assigned_to)) = LOWER(TRIM(e.name))
		WHERE e.id = $1
		GROUP BY e.id, e.name, e.email, e.department, e.role, e.created_at
	`, id).Scan(&e.ID, &e.Name, &e.Email, &e.Department, &e.Role, &e.CreatedAt, &e.AssignedAssetsCount)

	if err == sql.ErrNoRows {
		http.Error(w, "Employee not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(e)
}

func updateEmployee(w http.ResponseWriter, r *http.Request, id int) {
	var emp Employee
	if err := json.NewDecoder(r.Body).Decode(&emp); err != nil {
		http.Error(w, "Invalid request payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	emp.Name = strings.TrimSpace(emp.Name)
	if emp.Name == "" {
		http.Error(w, "Employee name is required", http.StatusBadRequest)
		return
	}

	var currentName string
	err := db.QueryRow("SELECT name FROM employees WHERE id = $1", id).Scan(&currentName)
	if err == sql.ErrNoRows {
		http.Error(w, "Employee not found", http.StatusNotFound)
		return
	}

	if emp.Email == "" {
		emp.Email = fmt.Sprintf("%s@company.com", strings.ToLower(strings.ReplaceAll(emp.Name, " ", ".")))
	}
	if emp.Department == "" {
		emp.Department = "General Staff"
	}
	if emp.Role == "" {
		emp.Role = "Team Member"
	}

	_, err = db.Exec(`
		UPDATE employees
		SET name = $1, email = $2, department = $3, role = $4
		WHERE id = $5
	`, emp.Name, emp.Email, emp.Department, emp.Role, id)
	if err != nil {
		http.Error(w, "Failed to update employee: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if strings.ToLower(currentName) != strings.ToLower(emp.Name) {
		_, _ = db.Exec("UPDATE assets SET assigned_to = $1 WHERE LOWER(assigned_to) = LOWER($2)", emp.Name, currentName)
	}

	getEmployeeByID(w, id)
}

func deleteEmployee(w http.ResponseWriter, id int) {
	var name string
	err := db.QueryRow("SELECT name FROM employees WHERE id = $1", id).Scan(&name)
	if err == sql.ErrNoRows {
		http.Error(w, "Employee not found", http.StatusNotFound)
		return
	}

	var assignedCount int
	_ = db.QueryRow("SELECT COUNT(*) FROM assets WHERE LOWER(assigned_to) = LOWER($1) AND UPPER(REPLACE(status, ' ', '_')) = 'ASSIGNED'", name).Scan(&assignedCount)
	if assignedCount > 0 {
		http.Error(w, fmt.Sprintf("Conflict: Cannot delete '%s' because they currently have %d hardware asset(s) assigned. Please return or reassign equipment first.", name, assignedCount), http.StatusConflict)
		return
	}

	_, err = db.Exec("DELETE FROM employees WHERE id = $1", id)
	if err != nil {
		http.Error(w, "Failed to delete employee: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Staff member '%s' deleted successfully", name),
	})
}

func createEmployee(w http.ResponseWriter, r *http.Request) {
	var emp Employee
	if err := json.NewDecoder(r.Body).Decode(&emp); err != nil {
		http.Error(w, "Invalid employee request payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	emp.Name = strings.TrimSpace(emp.Name)
	if emp.Name == "" {
		http.Error(w, "Employee name is required", http.StatusBadRequest)
		return
	}

	emp.Email = strings.TrimSpace(emp.Email)
	if emp.Email == "" {
		emp.Email = fmt.Sprintf("%s@company.com", strings.ToLower(strings.ReplaceAll(emp.Name, " ", ".")))
	}

	if emp.Department == "" {
		emp.Department = "General Staff"
	}
	if emp.Role == "" {
		emp.Role = "Team Member"
	}

	var existsID int
	err := db.QueryRow("SELECT id FROM employees WHERE LOWER(email) = LOWER($1) OR LOWER(name) = LOWER($2)", emp.Email, emp.Name).Scan(&existsID)
	if err == nil {
		http.Error(w, fmt.Sprintf("Employee with name '%s' or email '%s' already exists", emp.Name, emp.Email), http.StatusConflict)
		return
	}

	err = db.QueryRow(`
		INSERT INTO employees (name, email, department, role)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`, emp.Name, emp.Email, emp.Department, emp.Role).Scan(&emp.ID, &emp.CreatedAt)

	if err != nil {
		http.Error(w, "Failed to save employee: "+err.Error(), http.StatusInternalServerError)
		return
	}

	emp.AssignedAssetsCount = 0
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(emp)
}

func handleAssetHistory(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	assetIDStr := r.URL.Query().Get("asset_id")
	assetCode := r.URL.Query().Get("asset_code")
	actionType := r.URL.Query().Get("action_type")
	search := strings.TrimSpace(r.URL.Query().Get("search"))
	limitStr := r.URL.Query().Get("limit")

	limit := 500
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	var conditions []string
	var args []interface{}
	argIdx := 1

	if assetIDStr != "" {
		if id, err := strconv.Atoi(assetIDStr); err == nil {
			conditions = append(conditions, fmt.Sprintf("h.asset_id = $%d", argIdx))
			args = append(args, id)
			argIdx++
		}
	}

	if assetCode != "" && strings.ToUpper(assetCode) != "ALL" {
		conditions = append(conditions, fmt.Sprintf("LOWER(h.asset_code) = LOWER($%d)", argIdx))
		args = append(args, assetCode)
		argIdx++
	}

	if actionType != "" && strings.ToUpper(actionType) != "ALL" {
		conditions = append(conditions, fmt.Sprintf("LOWER(h.action_type) = LOWER($%d)", argIdx))
		args = append(args, actionType)
		argIdx++
	}

	if search != "" {
		searchPattern := "%" + strings.ToLower(search) + "%"
		conditions = append(conditions, fmt.Sprintf(`(
			LOWER(h.asset_code) LIKE $%d OR 
			LOWER(COALESCE(NULLIF(h.asset_name, ''), a.asset_name, '')) LIKE $%d OR 
			LOWER(COALESCE(h.employee, '')) LIKE $%d OR 
			LOWER(COALESCE(h.notes, '')) LIKE $%d
		)`, argIdx, argIdx, argIdx, argIdx))
		args = append(args, searchPattern)
		argIdx++
	}

	query := `
		SELECT h.id, h.asset_id, h.asset_code, 
		       COALESCE(NULLIF(h.asset_name, ''), a.asset_name, '') as asset_name,
		       h.action_type, h.employee, h.action_date, COALESCE(h.notes, '') as notes
		FROM asset_history h
		LEFT JOIN assets a ON h.asset_id = a.id
	`
	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += fmt.Sprintf(" ORDER BY h.action_date DESC, h.id DESC LIMIT $%d", argIdx)
	args = append(args, limit)

	rows, err := db.Query(query, args...)
	if err != nil {
		http.Error(w, "Failed to query asset history: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var history []AssetHistory
	for rows.Next() {
		var h AssetHistory
		if err := rows.Scan(&h.ID, &h.AssetID, &h.AssetCode, &h.AssetName, &h.ActionType, &h.Employee, &h.ActionDate, &h.Notes); err != nil {
			http.Error(w, "Failed to scan history: "+err.Error(), http.StatusInternalServerError)
			return
		}
		history = append(history, h)
	}
	if history == nil {
		history = []AssetHistory{}
	}

	json.NewEncoder(w).Encode(history)
}

func main() {
	connStr := "host=localhost port=5432 user=postgres password=sql123 dbname=it_asset_management sslmode=disable"
	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatalf("Cannot connect to DB: %v\n", err)
	}

	fmt.Println("Connected to PostgreSQL successfully!")
	initDatabase()

	mux := http.NewServeMux()
	mux.HandleFunc("/api/assets", handleAssets)
	mux.HandleFunc("/api/assets/", handleAssetByID)
	mux.HandleFunc("/api/asset-history", handleAssetHistory)
	mux.HandleFunc("/api/employees", handleEmployees)
	mux.HandleFunc("/api/employees/", handleEmployeeByID)

	fmt.Println("Backend server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", corsMiddleware(mux)))
}
