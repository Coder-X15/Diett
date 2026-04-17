-- Diet Planner Database Schema for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Foods table: Store identified and tracked foods
CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  calories INT,
  protein_g DECIMAL(10, 2),
  carbs_g DECIMAL(10, 2),
  fat_g DECIMAL(10, 2),
  fiber_g DECIMAL(10, 2),
  serving_size VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meal Plans table: Store meal plans for users
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week VARCHAR(20) NOT NULL,
  breakfast TEXT,
  lunch TEXT,
  dinner TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_day UNIQUE(user_id, day_of_week)
);

-- User Diets/Preferences table: Store user dietary restrictions and preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  dietary_restrictions TEXT[], -- Array of restrictions (e.g., vegan, gluten-free)
  allergies TEXT[], -- Array of known allergies
  calorie_goal INT,
  protein_goal DECIMAL(10, 2),
  carbs_goal DECIMAL(10, 2),
  fat_goal DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meal Evaluations table: Store meal evaluation results
CREATE TABLE meal_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  evaluation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_approved BOOLEAN,
  overall_score DECIMAL(5, 2),
  feedback TEXT,
  recommendations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Food Identifications table: Store history of identified foods from images
CREATE TABLE food_identifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id),
  image_url TEXT,
  identified_food_name VARCHAR(255),
  confidence_score DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Meal History table: Track what meals the user has consumed
CREATE TABLE user_meal_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id),
  meal_type VARCHAR(50), -- breakfast, lunch, dinner, snack
  consumed_date DATE NOT NULL,
  quantity DECIMAL(10, 2),
  unit VARCHAR(50), -- grams, cups, pieces, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nutrition Logs table: Daily nutrition tracking
CREATE TABLE nutrition_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  total_calories INT,
  total_protein DECIMAL(10, 2),
  total_carbs DECIMAL(10, 2),
  total_fat DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_date UNIQUE(user_id, log_date)
);

-- Create indexes for better query performance
CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_day ON meal_plans(day_of_week);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_meal_evaluations_user_id ON meal_evaluations(user_id);
CREATE INDEX idx_food_identifications_user_id ON food_identifications(user_id);
CREATE INDEX idx_user_meal_history_user_id ON user_meal_history(user_id);
CREATE INDEX idx_user_meal_history_date ON user_meal_history(consumed_date);
CREATE INDEX idx_nutrition_logs_user_id ON nutrition_logs(user_id);
CREATE INDEX idx_nutrition_logs_date ON nutrition_logs(log_date);

-- Sample food data (optional)
INSERT INTO foods (name, description, calories, protein_g, carbs_g, fat_g, fiber_g, serving_size) VALUES
  ('Chicken Breast', 'Skinless, cooked', 165, 31, 0, 3.6, 0, '100g'),
  ('Brown Rice', 'Cooked', 111, 2.6, 23, 0.9, 1.8, '100g'),
  ('Broccoli', 'Raw', 34, 2.8, 7, 0.4, 2.4, '100g'),
  ('Salmon', 'Cooked', 208, 20, 0, 13, 0, '100g'),
  ('Sweet Potato', 'Cooked', 86, 1.6, 20, 0.1, 3, '100g'),
  ('Eggs', 'Large, cooked', 155, 13, 1.1, 11, 0, '1 egg'),
  ('Oats', 'Dry', 389, 17, 66, 6.9, 10.6, '100g'),
  ('Banana', 'Medium', 105, 1.3, 27, 0.3, 3.1, '1 banana'),
  ('Almonds', 'Raw', 579, 21, 22, 50, 12.5, '100g'),
  ('Greek Yogurt', 'Plain, low-fat', 59, 10, 3.2, 0.4, 0, '100g');
