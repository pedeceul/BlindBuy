package models

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"entgo.io/ent/schema/mixin"
)

// Review holds the schema definition for the Review entity.
type Review struct {
	ent.Schema
}

// Fields of the Review.
func (Review) Fields() []ent.Field {
	return []ent.Field{
		field.Int("id").
			Positive().
			Comment("The unique identifier of the review"),
		field.Enum("review_type").
			Values("ad", "seller").
			Comment("The type of review (ad or seller)"),
		field.Int("rating").
			Min(1).
			Max(5).
			Comment("The rating (1-5)"),
		field.Text("comment").
			Comment("The review comment"),
		field.String("phone").
			Optional().
			Comment("The phone number of the reviewer"),
	}
}

// Edges of the Review.
func (Review) Edges() []ent.Edge {
	return []ent.Edge{
		// Review belongs to an ad
		edge.From("ad", Ad.Type).
			Ref("reviews").
			Unique().
			Comment("The ad this review belongs to"),
	}
}

// Indexes of the Review.
func (Review) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("review_type"),
		index.Fields("phone"),
		index.Fields("rating"),
		index.Fields("create_time"),
	}
}

// Mixin of the Review.
func (Review) Mixin() []ent.Mixin {
	return []ent.Mixin{
		mixin.Time{},
	}
}
