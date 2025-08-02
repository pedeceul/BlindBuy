package handlers

import (
	"github.com/gofiber/fiber/v2"
)

// SetupRoutes sets up the REST API routes
func SetupRoutes(router fiber.Router, db interface{}) {
	// Health check
	router.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "API is running",
		})
	})

	// Users routes
	users := router.Group("/users")
	users.Get("/", getUsers)
	users.Get("/:id", getUser)
	users.Post("/", createUser)
	users.Put("/:id", updateUser)
	users.Delete("/:id", deleteUser)

	// Reviews routes
	reviews := router.Group("/reviews")
	reviews.Get("/", getReviews)
	reviews.Get("/:id", getReview)
	reviews.Post("/", createReview)
	reviews.Put("/:id", updateReview)
	reviews.Delete("/:id", deleteReview)
}

// SetupAdminRoutes sets up the admin API routes
func SetupAdminRoutes(router fiber.Router, db interface{}) {
	// Admin health check
	router.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "Admin API is running",
		})
	})

	// Admin users routes
	users := router.Group("/users")
	users.Get("/", getUsers)
	users.Get("/:id", getUser)
	users.Post("/", createUser)
	users.Put("/:id", updateUser)
	users.Delete("/:id", deleteUser)

	// Admin reviews routes
	reviews := router.Group("/reviews")
	reviews.Get("/", getReviews)
	reviews.Get("/:id", getReview)
	reviews.Post("/", createReview)
	reviews.Put("/:id", updateReview)
	reviews.Delete("/:id", deleteReview)
}

// User handlers
func getUsers(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"message": "Get users - coming soon",
	})
}

func getUser(c *fiber.Ctx) error {
	id := c.Params("id")
	return c.JSON(fiber.Map{
		"message": "Get user " + id + " - coming soon",
	})
}

func createUser(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"message": "Create user - coming soon",
	})
}

func updateUser(c *fiber.Ctx) error {
	id := c.Params("id")
	return c.JSON(fiber.Map{
		"message": "Update user " + id + " - coming soon",
	})
}

func deleteUser(c *fiber.Ctx) error {
	id := c.Params("id")
	return c.JSON(fiber.Map{
		"message": "Delete user " + id + " - coming soon",
	})
}

// Review handlers
func getReviews(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"message": "Get reviews - coming soon",
	})
}

func getReview(c *fiber.Ctx) error {
	id := c.Params("id")
	return c.JSON(fiber.Map{
		"message": "Get review " + id + " - coming soon",
	})
}

func createReview(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"message": "Create review - coming soon",
	})
}

func updateReview(c *fiber.Ctx) error {
	id := c.Params("id")
	return c.JSON(fiber.Map{
		"message": "Update review " + id + " - coming soon",
	})
}

func deleteReview(c *fiber.Ctx) error {
	id := c.Params("id")
	return c.JSON(fiber.Map{
		"message": "Delete review " + id + " - coming soon",
	})
}
