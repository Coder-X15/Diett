package inference

import (
	"encoding/json"
	"net/http"
	"os"
	"server/db"
	"strings"
)

// setting the inference API URL from environment variable
var inferenceAPi string = os.Getenv("INFERENCE_API")

type InferenceRequest struct {
	UserID string `json:"user_id"`
	Image  string `json:"image"`
}

func IdentifyFood(w http.ResponseWriter, r *http.Request) {
	// parse request body
	var req InferenceRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// store the image locally first before uploading to supabase storage
	// filename: userID + timestamp
	user := req.UserID

	relativePath := "images/" + user + "_" + "timestamp.jpg"

	// Stream directly from the string reader to avoid duplicate memory allocation
	imageReader := strings.NewReader(req.Image)
	_res, err := db.Client.Storage.UploadFile("diett-bucket", relativePath, imageReader)
	// using unused variable to avoid compilation error - will be used in future for storing image metadata in the database
	_ = _res
	if err != nil {
		http.Error(w, "Failed to upload image to storage", http.StatusInternalServerError)
		return
	}
	res := db.Client.Storage.GetPublicUrl("diett-bucket", relativePath)
	if res.SignedURL == "" {
		http.Error(w, "Failed to get public URL for image", http.StatusInternalServerError)
		return
	}

	// write record to database with image URL and user ID for future reference
	query := db.Client.From("food_identifications").Insert(
		map[string]interface{}{
			"user_id":    user,
			"image_url":  res.SignedURL,
			"created_at": "now()",
		}, false, " ", " ", "exact")
	data, _, err := query.Execute()
	if err != nil {
		http.Error(w, "Failed to write record to database", http.StatusInternalServerError)
		return
	}

	// write back a response to the frontend as below:
	/*
		{
			"status":"SUBMITTED",
			"id": "record ID from the database for future reference"
		}
	*/
	var row map[string]interface{}
	json.Unmarshal(data, &row)
	response := map[string]string{
		"status": "SUBMITTED",
		"id":     row["id"].(string),
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

type InferenceResultPayload struct {
	ID                 string `json:"id"`
	IdentifiedFoodName string `json:"identified_food_name"`
}

func InferenceWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload InferenceResultPayload
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Update the database with the result from Kaggle
	updateData := map[string]interface{}{
		"identified_food_name": payload.IdentifiedFoodName,
	}

	query := db.Client.From("food_identifications").Update(updateData, "", "").Eq("id", payload.ID)
	_, _, err = query.Execute()
	if err != nil {
		http.Error(w, "Failed to update database", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"SUCCESS"}`))
}
