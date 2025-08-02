# OLX Reviews API Documentation

## Overview

The OLX Reviews API is built with Go Fiber and provides GraphQL endpoints for managing ads, reviews, and users.

## Base URL

- **Development**: http://localhost:4000
- **Production**: https://api.olx-reviews.com

## GraphQL Endpoint

- **Query**: `POST /query`
- **Playground**: `GET /playground`

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Data Types

### Ad
```graphql
type Ad {
  id: ID!
  url: String!
  title: String
  price: String
  category: String
  createdAt: Time!
  reviews: [Review!]
}
```

### Review
```graphql
type Review {
  id: ID!
  rating: Int!
  comment: String!
  createdAt: Time!
  user: User
  ad: Ad
}
```

### User
```graphql
type User {
  id: ID!
  name: String!
  email: String!
  createdAt: Time!
  reviews: [Review!]
}
```

## Queries

### Get Ad with Reviews
```graphql
query GetAd($url: String!) {
  ad(url: $url) {
    id
    url
    title
    price
    category
    createdAt
    reviews {
      id
      rating
      comment
      createdAt
      user {
        id
        name
      }
    }
  }
}
```

**Variables:**
```json
{
  "url": "https://www.olx.ro/d/oferta/example-ad"
}
```

### Get All Ads
```graphql
query GetAds {
  ads {
    id
    url
    title
    price
    category
    createdAt
    reviews {
      id
      rating
      comment
    }
  }
}
```

### Get User Reviews
```graphql
query GetUserReviews {
  userReviews {
    id
    rating
    comment
    createdAt
    ad {
      id
      title
      url
    }
  }
}
```

## Mutations

### Create Ad
```graphql
mutation CreateAd($input: AdInput!) {
  createAd(input: $input) {
    id
    url
    title
    price
    category
    createdAt
  }
}
```

**Variables:**
```json
{
  "input": {
    "url": "https://www.olx.ro/d/oferta/example-ad",
    "title": "iPhone 12 Pro",
    "price": "2500 RON",
    "category": "Electronics"
  }
}
```

### Create Review
```graphql
mutation CreateReview($input: ReviewInput!) {
  createReview(input: $input) {
    id
    rating
    comment
    createdAt
    user {
      id
      name
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "adUrl": "https://www.olx.ro/d/oferta/example-ad",
    "rating": 5,
    "comment": "Great seller, fast delivery!"
  }
}
```

### Update Review
```graphql
mutation UpdateReview($id: ID!, $input: ReviewInput!) {
  updateReview(id: $id, input: $input) {
    id
    rating
    comment
    updatedAt
  }
}
```

### Delete Review
```graphql
mutation DeleteReview($id: ID!) {
  deleteReview(id: $id) {
    id
  }
}
```

## Error Handling

The API returns errors in the following format:

```json
{
  "errors": [
    {
      "message": "Error description",
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ],
      "path": ["createReview"]
    }
  ],
  "data": null
}
```

## Common Error Codes

- `UNAUTHENTICATED`: User not authenticated
- `FORBIDDEN`: User doesn't have permission
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Input validation failed
- `INTERNAL_ERROR`: Server error

## Rate Limiting

- **Requests per minute**: 100
- **Burst limit**: 10 requests per second
- **Rate limit header**: `X-RateLimit-Remaining`

## WebSocket Subscriptions

For real-time updates, connect to the WebSocket endpoint:

```javascript
const ws = new WebSocket('ws://localhost:4000/subscriptions');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

### Available Subscriptions

```graphql
subscription OnReviewAdded($adUrl: String!) {
  reviewAdded(adUrl: $adUrl) {
    id
    rating
    comment
    user {
      name
    }
  }
}
```

## Testing with cURL

### Get Ad
```bash
curl -X POST http://localhost:4000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetAd($url: String!) { ad(url: $url) { id title reviews { rating comment } } }",
    "variables": {"url": "https://www.olx.ro/d/oferta/example"}
  }'
```

### Create Review
```bash
curl -X POST http://localhost:4000/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "query": "mutation CreateReview($input: ReviewInput!) { createReview(input: $input) { id rating comment } }",
    "variables": {
      "input": {
        "adUrl": "https://www.olx.ro/d/oferta/example",
        "rating": 5,
        "comment": "Great experience!"
      }
    }
  }'
```

## SDK Examples

### JavaScript/TypeScript
```javascript
import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient('http://localhost:4000/query');

const getAd = async (url) => {
  const query = `
    query GetAd($url: String!) {
      ad(url: $url) {
        id
        title
        reviews {
          rating
          comment
        }
      }
    }
  `;
  
  return client.request(query, { url });
};
```

### Python
```python
import requests

def get_ad(url):
    query = """
    query GetAd($url: String!) {
        ad(url: $url) {
            id
            title
            reviews {
                rating
                comment
            }
        }
    }
    """
    
    response = requests.post(
        'http://localhost:4000/query',
        json={'query': query, 'variables': {'url': url}}
    )
    return response.json()
```

## Health Check

```bash
curl http://localhost:4000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0"
}
``` 