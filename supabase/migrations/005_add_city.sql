-- Migration: Add city column for multi-city support
-- Story 9.1: Metro Region Registry + Type Updates

ALTER TABLE restaurants ADD COLUMN city TEXT;
CREATE INDEX idx_restaurants_city ON restaurants (city);
