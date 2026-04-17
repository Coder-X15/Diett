# Diet Planner API Documentation

This document outlines the API endpoints for the Diet Planner application. The API is built using Go and provides authentication, food identification, and meal planning functionalities.

## Base URL
```
http://localhost:8080
```

## Authentication Endpoints

### POST /signup
Creates a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "phone": "+1234567890",
  "password": "securepassword",
  "data": {
    "additional": "user data"
  }
}
```

**Response:**
```json
{
  "id": "user-id",
  "aud": "authenticated",
  "role": "authenticated",
  "email": "user@example.com",
  "phone": "+1234567890",
  "app_metadata": {},
  "user_metadata": {}
}
```

### POST /signin
Authenticates an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "id": "user-id",
  "aud": "authenticated",
  "role": "authenticated",
  "email": "user@example.com",
  "phone": "+1234567890",
  "app_metadata": {},
  "user_metadata": {}
}
```

### POST /signout
Logs out the current user.

**Request Body:** None

**Response:** HTTP 200 OK

## Food Identification Endpoint

### POST /id_food
Identifies food from an image using an external inference API.

**Request Body:**
```json
{
  "image": "base64-encoded-image-data"
}
```

**Response:** 
The response is proxied from the external inference API. Typically returns JSON with food identification results.

## Meal Planning Endpoints

These endpoints are defined in the code but not yet wired into the main server. They proxy requests to an external meal planner API.

### POST /evaluate
Evaluates a meal against user dietary restrictions and preferences.

**Request Body:**
```json
{
  "day": "Monday",
  "breakfast": ["oatmeal", "banana"],
  "lunch": ["salad", "chicken"],
  "dinner": ["pasta", "vegetables"]
}
```

**Response:** 
The response is proxied from the external meal planner API. Typically returns an evaluated meal plan.

### POST /plan
Plans a meal for a day based on user dietary restrictions and preferences.

**Request Body:**
```json
{
  "day": "Monday",
  "breakfast": ["oatmeal", "banana"],
  "lunch": ["salad", "chicken"],
  "dinner": ["pasta", "vegetables"]
}
```

**Response:** 
The response is proxied from the external meal planner API. Typically returns a planned meal for the day.

### POST /nutrition
Gets nutritional information for a meal.

**Request Body:**
```json
{
  "day": "Monday",
  "breakfast": ["oatmeal", "banana"],
  "lunch": ["salad", "chicken"],
  "dinner": ["pasta", "vegetables"]
}
```

**Response:**
```json
{
  "calories": 500,
  "protein": 25,
  "carbs": 60,
  "fat": 15
}
```

## Environment Variables
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase API key
- `INFERENCE_API`: URL for the external food identification API
- `MEAL_PLANNER_API`: URL for the external meal planner API

## Notes
- All endpoints expect JSON request bodies where applicable.
- Authentication is handled via Supabase.
- Food identification and meal planning are proxied to external services.
- The meal planning endpoints (/evaluate, /plan, /nutrition) are implemented but not yet registered in the main server router.</content>
<parameter name="filePath">/home/sam-ruben-abraham/dietplanner/apiDocumentation.md