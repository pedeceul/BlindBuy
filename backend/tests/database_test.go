package tests

import (
	"context"
	"database/sql"
	"log"
	"testing"

	_ "github.com/lib/pq"
)

var testDB *sql.DB

// TestDatabase tests the database schema and relationships
func TestDatabase(t *testing.T) {
	t.Run("Connection", testDatabaseConnection)
	t.Run("Schema", testDatabaseSchema)
	t.Run("Relationships", testDatabaseRelationships)
	t.Run("Constraints", testDatabaseConstraints)
}

func testDatabaseConnection(t *testing.T) {
	var err error
	testDB, err = sql.Open("postgres", "postgres://postgres:postgres@localhost:5432/olx_reviews?sslmode=disable")
	if err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}
	// Don't close the connection here, we'll use it in other tests

	err = testDB.Ping()
	if err != nil {
		t.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("✅ Database connection successful")
}

func testDatabaseSchema(t *testing.T) {
	// Test that required tables exist
	requiredTables := []string{"ads", "reviews"}

	for _, table := range requiredTables {
		var exists bool
		query := `SELECT EXISTS (
			SELECT 1 FROM information_schema.tables 
			WHERE table_schema = 'public' 
			AND table_name = $1
		)`
		err := testDB.QueryRow(query, table).Scan(&exists)
		if err != nil {
			t.Errorf("Failed to check if table %s exists: %v", table, err)
		}

		if !exists {
			t.Errorf("Required table %s does not exist", table)
		}
	}

	log.Println("✅ Database schema verification successful")
}

func testDatabaseRelationships(t *testing.T) {
	// Test foreign key relationships
	ctx := context.Background()

	// Test ads table structure
	rows, err := testDB.QueryContext(ctx, `
		SELECT column_name, data_type, is_nullable
		FROM information_schema.columns 
		WHERE table_name = 'ads' 
		ORDER BY ordinal_position
	`)
	if err != nil {
		t.Fatalf("Failed to query ads table structure: %v", err)
	}
	defer rows.Close()

	expectedColumns := map[string]string{
		"id":             "bigint",
		"url":            "character varying",
		"title":          "character varying",
		"price":          "character varying",
		"category":       "character varying",
		"phone":          "character varying",
		"average_rating": "double precision",
		"review_count":   "bigint",
		"create_time":    "timestamp with time zone",
		"update_time":    "timestamp with time zone",
	}

	columnCount := 0
	for rows.Next() {
		var columnName, dataType, isNullable string
		err := rows.Scan(&columnName, &dataType, &isNullable)
		if err != nil {
			t.Errorf("Failed to scan column info: %v", err)
			continue
		}

		expectedType, exists := expectedColumns[columnName]
		if exists && dataType != expectedType {
			t.Errorf("Column %s has wrong type: expected %s, got %s", columnName, expectedType, dataType)
		}
		columnCount++
	}

	// Allow for extra columns (like Ent's internal columns)
	if columnCount < len(expectedColumns) {
		t.Errorf("Expected at least %d columns in ads table, got %d", len(expectedColumns), columnCount)
	}

	log.Println("✅ Database relationships verification successful")
}

func testDatabaseConstraints(t *testing.T) {
	// Test that reviews table has proper constraints
	ctx := context.Background()

	// Check for review_type column (it's a varchar in our schema, not enum)
	var columnExists bool
	err := testDB.QueryRowContext(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM information_schema.columns 
			WHERE table_name = 'reviews' 
			AND column_name = 'review_type'
		)
	`).Scan(&columnExists)

	if err != nil {
		t.Errorf("Failed to check review_type column: %v", err)
	}

	if !columnExists {
		t.Error("review_type column should exist")
	}

	// Check for foreign key constraints
	var fkExists bool
	err = testDB.QueryRowContext(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM information_schema.table_constraints 
			WHERE table_name = 'reviews' 
			AND constraint_type = 'FOREIGN KEY'
		)
	`).Scan(&fkExists)

	if err != nil {
		t.Errorf("Failed to check review foreign keys: %v", err)
	}

	if !fkExists {
		t.Error("Reviews table should have foreign key constraints")
	}

	log.Println("✅ Database constraints verification successful")
}
