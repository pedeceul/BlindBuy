#!/bin/bash

# Migration script to update database schema to normalized structure
# This script handles the transition from the old review structure to the new one

set -e

echo "🔄 Starting database schema migration..."

# Check if database exists
if ! psql -U olx_user -d olx_reviews -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Database 'olx_reviews' does not exist. Please run setup-db.sh first."
    exit 1
fi

echo "📊 Current database state:"
psql -U olx_user -d olx_reviews -c "
SELECT 
    schemaname,
    tablename,
    attname,
    format_type(a.atttypid, a.atttypmod) as data_type
FROM pg_tables t
JOIN pg_attribute a ON a.attrelid = t.tablename::regclass
WHERE schemaname = 'public'
ORDER BY tablename, attname;
"

echo ""
echo "🔄 Backing up existing data..."
psql -U olx_user -d olx_reviews -c "
-- Create backup tables
CREATE TABLE IF NOT EXISTS reviews_backup AS SELECT * FROM reviews;
CREATE TABLE IF NOT EXISTS ads_backup AS SELECT * FROM ads;
CREATE TABLE IF NOT EXISTS sellers_backup AS SELECT * FROM sellers;
"

echo "🔄 Dropping old tables..."
psql -U olx_user -d olx_reviews -c "
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS ads CASCADE;
DROP TABLE IF EXISTS sellers CASCADE;
"

echo "🔄 Running Ent code generation..."
cd /Users/dan/code/go/missing-reviews/backend
go run entc.go

echo "🔄 Running new migrations..."
go run -mod=mod entgo.io/ent/cmd/ent migrate --dir=./internal --dev-url="postgres://olx_user:olx_password@localhost:5432/olx_reviews?sslmode=disable"

echo "🔄 Migrating existing data..."
psql -U olx_user -d olx_reviews -c "
-- Migrate ads data
INSERT INTO ads (url, title, phone, average_rating, review_count, created_at, updated_at)
SELECT url, title, phone, average_rating, review_count, created_at, updated_at
FROM ads_backup;

-- Migrate sellers data (if any)
INSERT INTO sellers (id, name, phone, average_rating, review_count, created_at, updated_at)
SELECT id, name, phone, average_rating, review_count, created_at, updated_at
FROM sellers_backup;

-- Migrate reviews data with proper relationships
INSERT INTO reviews (review_type, rating, comment, phone, created_at, updated_at, ad_id)
SELECT 
    CASE 
        WHEN ad_url IS NOT NULL THEN 'ad'
        WHEN seller_id IS NOT NULL THEN 'seller'
        ELSE 'ad' -- Default to ad if unclear
    END as review_type,
    rating,
    comment,
    phone,
    created_at,
    created_at as updated_at,
    a.id as ad_id
FROM reviews_backup r
LEFT JOIN ads a ON r.ad_url = a.url
WHERE r.ad_url IS NOT NULL;

-- Migrate seller reviews
INSERT INTO reviews (review_type, rating, comment, phone, created_at, updated_at, seller_id)
SELECT 
    'seller' as review_type,
    rating,
    comment,
    phone,
    created_at,
    created_at as updated_at,
    s.id as seller_id
FROM reviews_backup r
JOIN sellers s ON r.seller_id = s.id
WHERE r.seller_id IS NOT NULL AND r.ad_url IS NULL;
"

echo "🔄 Updating statistics..."
psql -U olx_user -d olx_reviews -c "
-- Update ad statistics
UPDATE ads SET 
    average_rating = COALESCE((
        SELECT AVG(rating) 
        FROM reviews 
        WHERE ad_id = ads.id AND review_type = 'ad'
    ), 0.0),
    review_count = COALESCE((
        SELECT COUNT(*) 
        FROM reviews 
        WHERE ad_id = ads.id AND review_type = 'ad'
    ), 0);

-- Update seller statistics
UPDATE sellers SET 
    average_rating = COALESCE((
        SELECT AVG(rating) 
        FROM reviews 
        WHERE seller_id = sellers.id AND review_type = 'seller'
    ), 0.0),
    review_count = COALESCE((
        SELECT COUNT(*) 
        FROM reviews 
        WHERE seller_id = sellers.id AND review_type = 'seller'
    ), 0),
    ad_count = COALESCE((
        SELECT COUNT(*) 
        FROM ads 
        WHERE seller_id = sellers.id
    ), 0);
"

echo "✅ Migration completed successfully!"
echo ""
echo "📊 New database structure:"
psql -U olx_user -d olx_reviews -c "
SELECT 
    schemaname,
    tablename,
    attname,
    format_type(a.atttypid, a.atttypmod) as data_type
FROM pg_tables t
JOIN pg_attribute a ON a.attrelid = t.tablename::regclass
WHERE schemaname = 'public'
ORDER BY tablename, attname;
"

echo ""
echo "📈 Data summary:"
psql -U olx_user -d olx_reviews -c "
SELECT 
    'ads' as table_name,
    COUNT(*) as count
FROM ads
UNION ALL
SELECT 
    'sellers' as table_name,
    COUNT(*) as count
FROM sellers
UNION ALL
SELECT 
    'reviews' as table_name,
    COUNT(*) as count
FROM reviews
UNION ALL
SELECT 
    'ad_reviews' as table_name,
    COUNT(*) as count
FROM reviews
WHERE review_type = 'ad'
UNION ALL
SELECT 
    'seller_reviews' as table_name,
    COUNT(*) as count
FROM reviews
WHERE review_type = 'seller';
" 