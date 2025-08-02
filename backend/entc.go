package main

import (
	"log"

	"entgo.io/ent/entc"
	"entgo.io/ent/entc/gen"
)

func main() {
	// Create a new Ent code generation configuration
	config := &gen.Config{
		Target:  "internal",
		Package: "blindbuy-backend/internal",
		Features: []gen.Feature{
			gen.FeaturePrivacy,
			gen.FeatureEntQL,
		},
	}

	// Generate the code
	if err := entc.Generate("./internal/models", config); err != nil {
		log.Fatal("Failed to generate Ent code:", err)
	}

	log.Println("Ent code generated successfully")
}
