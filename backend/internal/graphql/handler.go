package graphql

import (
	"log"
	"strings"

	"blindbuy-backend/internal"
	"blindbuy-backend/internal/ad"
	"blindbuy-backend/internal/review"

	"github.com/gofiber/fiber/v2"
)

// GraphQLHandler handles GraphQL requests
type GraphQLHandler struct {
	client *internal.Client
}

// NewGraphQLHandler creates a new GraphQL handler
func NewGraphQLHandler(client *internal.Client) *GraphQLHandler {
	return &GraphQLHandler{client: client}
}

// Handle handles GraphQL requests
func (h *GraphQLHandler) Handle(c *fiber.Ctx) error {
	// Check if client is available
	if h.client == nil {
		return c.Status(500).JSON(fiber.Map{
			"errors": []fiber.Map{
				{"message": "Database connection not available"},
			},
		})
	}

	// Parse the request body
	var request struct {
		Query     string                 `json:"query"`
		Variables map[string]interface{} `json:"variables"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"errors": []fiber.Map{
				{"message": "Invalid request body"},
			},
		})
	}

	// Debug: log the query
	log.Printf("Received query: %s", request.Query)
	log.Printf("Contains CreateAdReview: %v", strings.Contains(request.Query, "CreateAdReview"))
	log.Printf("Contains createAdReview: %v", strings.Contains(request.Query, "createAdReview"))

	// Handle specific queries based on the request
	if request.Query == "{ __typename }" {
		return c.JSON(fiber.Map{
			"data": fiber.Map{
				"__typename": "Query",
			},
		})
	}

	// Check for GetAdReviews query
	if strings.Contains(request.Query, "GetAdReviews") && strings.Contains(request.Query, "ad(url: $url)") {
		log.Printf("Matched GetAdReviews query")
		return h.handleGetAdReviews(c, request.Variables)
	}

	// Check for GetUserReviews query
	if strings.Contains(request.Query, "GetUserReviews") && strings.Contains(request.Query, "userReviews") {
		log.Printf("Matched GetUserReviews query")
		return h.handleGetUserReviews(c, request.Variables)
	}

	// Check for AddReview mutation
	if strings.Contains(request.Query, "AddReview") && strings.Contains(request.Query, "createReview(input: $input)") {
		log.Printf("Matched AddReview mutation")
		return h.handleAddReview(c, request.Variables)
	}

	// Check for CreateAdReview mutation
	if strings.Contains(request.Query, "CreateAdReview") && strings.Contains(request.Query, "createAdReview") {
		log.Printf("Matched CreateAdReview mutation")
		return h.handleAddReview(c, request.Variables)
	}

	log.Printf("No pattern matched, returning default response")
	// Default response for unknown queries
	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"__typename": "Query",
		},
	})
}

// handleGetAdReviews handles the GetAdReviews query
func (h *GraphQLHandler) handleGetAdReviews(c *fiber.Ctx, variables map[string]interface{}) error {
	url := variables["url"].(string)

	// Strip query parameters from URL
	cleanURL := strings.Split(url, "?")[0]
	log.Printf("Fetching reviews for original URL: %s, clean URL: %s", url, cleanURL)

	// Try to find existing ad
	ad, err := h.client.Ad.Query().Where(ad.URL(cleanURL)).First(c.Context())
	if err != nil {
		// Return empty result if ad not found
		return c.JSON(fiber.Map{
			"data": fiber.Map{
				"ad": nil,
			},
		})
	}

	// Fetch reviews for this ad URL
	log.Printf("Fetching reviews for clean URL: %s", cleanURL)
	reviews, err := h.client.Review.Query().Where(review.ReviewTypeEQ("ad")).All(c.Context())
	if err != nil {
		log.Printf("Error fetching reviews: %v", err)
		reviews = []*internal.Review{}
	}

	// Format reviews for response
	var formattedReviews []fiber.Map
	for _, r := range reviews {
		formattedReviews = append(formattedReviews, fiber.Map{
			"id":        r.ID,
			"rating":    r.Rating,
			"comment":   r.Comment,
			"createdAt": r.CreateTime,
			"user": fiber.Map{
				"id":   "1",
				"name": "Anonymous",
			},
		})
	}

	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"ad": fiber.Map{
				"id":      ad.ID,
				"title":   ad.Title,
				"price":   nil, // Not in our schema
				"reviews": formattedReviews,
			},
		},
	})
}

// handleAddReview handles the AddReview mutation
func (h *GraphQLHandler) handleAddReview(c *fiber.Ctx, variables map[string]interface{}) error {
	input := variables["input"].(map[string]interface{})

	// First, get or create the ad
	adURL := input["adUrl"].(string)
	// Strip query parameters from URL
	cleanURL := strings.Split(adURL, "?")[0]
	log.Printf("Original URL: %s, Clean URL: %s", adURL, cleanURL)

	_, err := h.client.Ad.Query().Where(ad.URL(cleanURL)).First(c.Context())
	if err != nil {
		// Create new ad if it doesn't exist
		adTitle := ""
		if title, ok := input["adTitle"].(string); ok {
			adTitle = title
		}

		log.Printf("Creating new ad with clean URL: %s, title: %s", cleanURL, adTitle)
		_, err = h.client.Ad.Create().
			SetURL(cleanURL).
			SetTitle(adTitle).
			Save(c.Context())
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"errors": []fiber.Map{
					{"message": "Failed to create ad"},
				},
			})
		}
	}

	// Create review with proper relationships
	log.Printf("Creating review with clean adURL: %s", cleanURL)

	// Get the ad first
	adEntity, err := h.client.Ad.Query().Where(ad.URL(cleanURL)).First(c.Context())
	if err != nil {
		log.Printf("Error finding ad: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"errors": []fiber.Map{
				{"message": "Failed to find ad"},
			},
		})
	}

	review, err := h.client.Review.Create().
		SetRating(int(input["rating"].(float64))).
		SetComment(input["comment"].(string)).
		SetReviewType("ad").
		SetAd(adEntity).
		Save(c.Context())
	if err != nil {
		log.Printf("Error creating review: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"errors": []fiber.Map{
				{"message": "Failed to create review"},
			},
		})
	}
	log.Printf("Review created successfully with ID: %d", review.ID)

	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"createReview": fiber.Map{
				"id":        review.ID,
				"rating":    review.Rating,
				"comment":   review.Comment,
				"createdAt": review.CreateTime,
				"user": fiber.Map{
					"id":   "1",
					"name": "Anonymous",
				},
			},
		},
	})
}

// handleGetUserReviews handles the GetUserReviews query
func (h *GraphQLHandler) handleGetUserReviews(c *fiber.Ctx, variables map[string]interface{}) error {
	// For now, return all reviews since we don't have user authentication
	log.Printf("Fetching all reviews for user")

	reviews, err := h.client.Review.Query().All(c.Context())
	if err != nil {
		log.Printf("Error fetching reviews: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"errors": []fiber.Map{
				{"message": "Failed to fetch reviews"},
			},
		})
	}

	// Format reviews for response
	var formattedReviews []fiber.Map
	for _, r := range reviews {
		formattedReviews = append(formattedReviews, fiber.Map{
			"id":        r.ID,
			"rating":    r.Rating,
			"comment":   r.Comment,
			"createdAt": r.CreateTime,
			"user": fiber.Map{
				"id":   "1",
				"name": "Anonymous",
			},
		})
	}

	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"userReviews": formattedReviews,
		},
	})
}

// PlaygroundHandler handles GraphQL playground requests
func (h *GraphQLHandler) PlaygroundHandler(c *fiber.Ctx) error {
	// This handler is no longer needed as the playground is removed from the schema.
	// Keeping it here for now, but it will not be called.
	return c.SendString("GraphQL Playground is no longer available.")
}
