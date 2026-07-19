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

## Meal Plan Endpoints

### GET /mealplan
Fetches an existing meal plan for a specific user and day.

**Query Parameters:**
- `user_id` (string, required): The UUID of the user.
- `day` (string, required): The day of the week (e.g., "Monday").

**Success Response (200 OK):**
```json
{
  "id": "plan-uuid",
  "user_id": "user-uuid",
  "day_of_week": "Monday",
  "breakfast": "Oats, Berries",
  "lunch": "Chicken Salad",
  "dinner": "Salmon, Asparagus",
  "notes": null,
  "created_at": "2023-10-27T10:00:00Z",
  "updated_at": "2023-10-27T10:00:00Z"
}
```

**Error Response (404 Not Found):**
Returned if no plan exists for the given user and day.

### POST /mealplan
Creates a new meal plan or updates an existing one (upsert).

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "day": "Monday",
  "breakfast": ["Oats", "Berries", "Nuts"],
  "lunch": ["Chicken Salad Sandwich"],
  "dinner": ["Salmon", "Asparagus", "Quinoa"]
}
```

**Success Response (200 OK):**
Returns the created or updated meal plan object.

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

## Chat Endpoint

### POST /chat
Sends a conversation to the hosted Ollama AI Dietician model.

**Request Body:**
```json
[
  {
    "role": "user",
    "content": "What should I eat for lunch?"
  }
]
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

## Notes
- All endpoints expect JSON request bodies where applicable.
- Authentication is handled via Supabase.
- Food identification is proxied to external services.
<parameter name="filePath">/home/sam-ruben-abraham/dietplanner/apiDocumentation.md