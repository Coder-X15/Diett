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
- `MEAL_PLANNER_API`: URL for the external meal planner API

## Notes
- All endpoints expect JSON request bodies where applicable.
- Authentication is handled via Supabase.
- Food identification is proxied to external services.
<parameter name="filePath">/home/sam-ruben-abraham/dietplanner/apiDocumentation.md