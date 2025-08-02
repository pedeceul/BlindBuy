package tests

import (
	"log"
	"os"
	"testing"
)

// TestMain runs before all tests
func TestMain(m *testing.M) {
	// Setup test environment
	log.Println("🧪 Setting up test environment...")

	// Run tests
	exitCode := m.Run()

	// Cleanup
	log.Println("🧹 Cleaning up test environment...")
	if testDB != nil {
		testDB.Close()
	}

	os.Exit(exitCode)
}

// TestAll runs all test suites
func TestAll(t *testing.T) {
	t.Run("Database", TestDatabase)
	t.Run("GraphQL", TestGraphQL)
	t.Run("API", TestAPI)
	t.Run("Models", TestModels)
}
