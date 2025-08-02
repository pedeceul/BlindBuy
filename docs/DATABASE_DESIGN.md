# Database Design Documentation

## Overview

The OLX Reviews database has been redesigned with proper normalization to support analytics and maintain data integrity. This document explains the new structure and migration process.

## 🚨 Previous Issues

### **1. Inconsistent Review Structure**
- Reviews had both `seller_id` and `ad_url` fields (optional)
- No clear distinction between ad reviews vs seller reviews
- Analytics queries were complex and error-prone

### **2. Empty Seller Table**
- Sellers table existed but was never populated
- No proper relationship between ads and sellers
- Seller reviews stored with `seller_id` but no corresponding seller record

### **3. No Proper Normalization**
- Reviews could be for either ads OR sellers, but structure was ambiguous
- No clear foreign key relationships
- Difficult to query "all reviews for this seller" vs "all reviews for this ad"

## ✅ New Normalized Structure

### **Database Schema**

```sql
-- Ads Table
CREATE TABLE ads (
    id SERIAL PRIMARY KEY,
    url VARCHAR UNIQUE NOT NULL,
    title VARCHAR,
    price VARCHAR,
    category VARCHAR,
    phone VARCHAR,
    average_rating FLOAT DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    seller_id VARCHAR REFERENCES sellers(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sellers Table
CREATE TABLE sellers (
    id VARCHAR PRIMARY KEY,
    name VARCHAR,
    phone VARCHAR,
    location VARCHAR,
    profile_url VARCHAR,
    average_rating FLOAT DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    ad_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reviews Table (Normalized)
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    review_type ENUM('ad', 'seller') NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    phone VARCHAR,
    ad_id INTEGER REFERENCES ads(id),
    seller_id VARCHAR REFERENCES sellers(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CHECK (
        (review_type = 'ad' AND ad_id IS NOT NULL AND seller_id IS NULL) OR
        (review_type = 'seller' AND seller_id IS NOT NULL AND ad_id IS NULL)
    )
);
```

### **Key Improvements**

#### **1. Clear Review Types**
- `review_type` field explicitly distinguishes between 'ad' and 'seller' reviews
- Database constraints ensure a review is either for an ad OR a seller, never both

#### **2. Proper Relationships**
- **Ad → Seller**: Many ads belong to one seller
- **Seller → Reviews**: One seller has many reviews
- **Ad → Reviews**: One ad has many reviews
- **Review → Ad/Seller**: Each review belongs to either an ad OR a seller

#### **3. Enhanced Analytics Support**
```sql
-- Easy queries for analytics
SELECT review_type, COUNT(*) as count FROM reviews GROUP BY review_type;
SELECT seller_id, AVG(rating) FROM reviews WHERE review_type = 'seller' GROUP BY seller_id;
SELECT ad_id, AVG(rating) FROM reviews WHERE review_type = 'ad' GROUP BY ad_id;
```

## 🔄 Migration Process

### **Step 1: Backup Existing Data**
```bash
cd backend/scripts
./migrate-schema.sh
```

The migration script will:
1. Create backup tables of existing data
2. Drop old tables
3. Generate new Ent models
4. Run new migrations
5. Migrate existing data to new structure
6. Update statistics (average ratings, review counts)

### **Step 2: Verify Migration**
```sql
-- Check data integrity
SELECT review_type, COUNT(*) FROM reviews GROUP BY review_type;
SELECT COUNT(*) FROM ads;
SELECT COUNT(*) FROM sellers;
```

## 📊 Analytics Queries

### **Review Distribution**
```sql
-- Reviews by type
SELECT 
    review_type,
    COUNT(*) as total_reviews,
    AVG(rating) as avg_rating
FROM reviews 
GROUP BY review_type;
```

### **Top Rated Sellers**
```sql
-- Top 10 sellers by average rating
SELECT 
    s.name,
    s.phone,
    AVG(r.rating) as avg_rating,
    COUNT(r.id) as review_count
FROM sellers s
JOIN reviews r ON s.id = r.seller_id
WHERE r.review_type = 'seller'
GROUP BY s.id, s.name, s.phone
HAVING COUNT(r.id) >= 3
ORDER BY avg_rating DESC
LIMIT 10;
```

### **Top Rated Ads**
```sql
-- Top 10 ads by average rating
SELECT 
    a.title,
    a.url,
    AVG(r.rating) as avg_rating,
    COUNT(r.id) as review_count
FROM ads a
JOIN reviews r ON a.id = r.ad_id
WHERE r.review_type = 'ad'
GROUP BY a.id, a.title, a.url
HAVING COUNT(r.id) >= 2
ORDER BY avg_rating DESC
LIMIT 10;
```

### **Review Trends**
```sql
-- Reviews per month
SELECT 
    DATE_TRUNC('month', created_at) as month,
    review_type,
    COUNT(*) as review_count
FROM reviews
GROUP BY month, review_type
ORDER BY month DESC;
```

## 🔧 GraphQL Schema Updates

### **New Types**
```graphql
enum ReviewType {
  AD
  SELLER
}

type Review {
  id: ID!
  reviewType: ReviewType!
  rating: Int!
  comment: String!
  phone: String
  ad: Ad
  seller: Seller
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### **New Mutations**
```graphql
input CreateAdReviewInput {
  adUrl: String!
  adTitle: String
  adPrice: String
  adCategory: String
  adPhone: String
  rating: Int!
  comment: String!
  phone: String
}

input CreateSellerReviewInput {
  sellerId: String!
  sellerName: String
  sellerPhone: String
  sellerLocation: String
  sellerProfileUrl: String
  rating: Int!
  comment: String!
  phone: String
}

type Mutation {
  createAdReview(input: CreateAdReviewInput!): Review!
  createSellerReview(input: CreateSellerReviewInput!): Review!
}
```

## 🚀 Benefits

### **1. Data Integrity**
- Clear constraints prevent invalid data
- Proper foreign key relationships
- No orphaned reviews

### **2. Analytics Ready**
- Easy to query reviews by type
- Simple aggregation queries
- Clear seller and ad statistics

### **3. Scalable**
- Proper indexing for performance
- Normalized structure reduces redundancy
- Easy to extend with new features

### **4. Maintainable**
- Clear separation of concerns
- Well-defined relationships
- Easy to understand and modify

## 📈 Future Enhancements

### **Potential Additions**
- Review categories (quality, communication, etc.)
- Review helpfulness voting
- Review moderation system
- Advanced analytics dashboard
- Review sentiment analysis

### **Performance Optimizations**
- Materialized views for common analytics
- Partitioning for large datasets
- Caching layer for frequently accessed data

---

**Note**: After running the migration, all existing functionality will continue to work, but with a much cleaner and more maintainable database structure. 