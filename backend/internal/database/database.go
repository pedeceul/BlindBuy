package database

import (
	"context"
	"log"
	"os"

	"blindbuy-backend/internal"

	"entgo.io/ent/dialect"
	"entgo.io/ent/dialect/sql"
	_ "github.com/lib/pq"
)

var client *internal.Client

// InitDB initializes the database connection and creates the schema
func InitDB() (*internal.Client, error) {
	dsn := os.Getenv("DSN")
	if dsn == "" {
		dsn = "postgres://postgres:postgres@localhost:5432/blindbuy?sslmode=disable"
	}

	log.Printf("Connecting to database with DSN: %s", dsn)

	// Create database driver
	drv, err := sql.Open(dialect.Postgres, dsn)
	if err != nil {
		log.Printf("Failed to open database connection: %v", err)
		return nil, err
	}

	// Test the connection
	if err := drv.DB().Ping(); err != nil {
		log.Printf("Failed to ping database: %v", err)
		return nil, err
	}

	log.Printf("Database connection successful")

	// Create Ent client
	client = internal.NewClient(internal.Driver(drv))

	log.Printf("Ent client created, attempting schema migration...")

	// Run schema migration
	if err := client.Schema.Create(context.Background()); err != nil {
		log.Printf("Failed to create schema: %v", err)
		return nil, err
	}

	log.Printf("Schema migration completed successfully")
	log.Println("Database initialized successfully")
	return client, nil
}

// GetClient returns the database client
func GetClient() *internal.Client {
	return client
}
