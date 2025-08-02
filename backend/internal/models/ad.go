package models

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"entgo.io/ent/schema/mixin"
)

// Ad holds the schema definition for the Ad entity.
type Ad struct {
	ent.Schema
}

// Fields of the Ad.
func (Ad) Fields() []ent.Field {
	return []ent.Field{
		field.Int("id").
			Positive().
			Comment("The unique identifier of the ad"),
		field.String("url").
			Unique().
			Comment("The URL of the ad"),
		field.String("title").
			Optional().
			Comment("The title of the ad"),
		field.String("price").
			Optional().
			Comment("The price of the ad"),
		field.String("category").
			Optional().
			Comment("The category of the ad"),
		field.String("phone").
			Optional().
			Comment("The phone number associated with the ad"),
		field.Float("average_rating").
			Default(0.0).
			Comment("The average rating of the ad"),
		field.Int("review_count").
			Default(0).
			Comment("The number of reviews for the ad"),
		field.Time("created_at").
			Default(time.Now).
			Comment("The creation timestamp"),
		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now).
			Comment("The last update timestamp"),
	}
}

// Edges of the Ad.
func (Ad) Edges() []ent.Edge {
	return []ent.Edge{
		// Ad has many reviews
		edge.To("reviews", Review.Type).
			Comment("The reviews for this ad"),
	}
}

// Indexes of the Ad.
func (Ad) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("url"),
		index.Fields("phone"),
		index.Fields("category"),
		index.Fields("created_at"),
	}
}

// Mixin of the Ad.
func (Ad) Mixin() []ent.Mixin {
	return []ent.Mixin{
		mixin.Time{},
	}
}
