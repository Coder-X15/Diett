package inference

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"server/db"
	"strings"
	"time"
)

type InferenceRequest struct {
	UserID string `json:"user_id"`
	Image  string `json:"image"`
}

func IdentifyFood(w http.ResponseWriter, r *http.Request) {
	// parse request body
	log.Println("[IdentifyFood] Started processing new request")
	var req InferenceRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		log.Printf("Failed to decode request body: %v\n", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	user := req.UserID
	if user == "" {
		log.Println("Rejecting request: User ID is empty")
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}
	log.Printf("[IdentifyFood] User ID: %s\n", user)

	// Create a unique filename using a real timestamp to avoid file conflicts
	timestamp := time.Now().UnixNano()
	relativePath := fmt.Sprintf("images/%s_%d.jpg", user, timestamp)
	log.Printf("[IdentifyFood] Generated filename: %s\n", relativePath)

	// Decode the base64 image data sent from the frontend
	b64data := req.Image
	log.Printf("[IdentifyFood] Received image string of length: %d\n", len(b64data))
	if idx := strings.Index(b64data, ","); idx != -1 {
		b64data = b64data[idx+1:]
	}
	decodedBytes, err := base64.StdEncoding.DecodeString(b64data)
	if err != nil {
		log.Printf("Failed to decode base64 image: %v\n", err)
		http.Error(w, "Failed to decode base64 image", http.StatusBadRequest)
		return
	}
	log.Printf("[IdentifyFood] Decoded image to %d bytes\n", len(decodedBytes))

	imageReader := bytes.NewReader(decodedBytes)
	log.Printf("[IdentifyFood] Uploading to Supabase Storage bucket 'diett-bucket'...\n")
	_res, err := db.Client.Storage.UploadFile("diett-bucket", relativePath, imageReader)
	// using unused variable to avoid compilation error - will be used in future for storing image metadata in the database
	_ = _res
	if err != nil {
		log.Printf("[IdentifyFood] Failed to upload image to storage: %v | Response: %+v\n", err, _res)
		http.Error(w, "Failed to upload image to storage", http.StatusInternalServerError)
		return
	}
	log.Println("[IdentifyFood] Upload successful, fetching public URL...")

	res := db.Client.Storage.GetPublicUrl("diett-bucket", relativePath)
	if res.SignedURL == "" {
		log.Println("Storage returned an empty public URL")
		http.Error(w, "Failed to get public URL for image", http.StatusInternalServerError)
		return
	}
	log.Printf("[IdentifyFood] Public URL retrieved: %s\n", res.SignedURL)

	// write record to database with image URL and user ID for future reference
	log.Println("[IdentifyFood] Inserting record into 'food_identifications' table...")
	query := db.Client.From("food_identifications").Insert(
		map[string]interface{}{
			"user_id":    user,
			"image_url":  res.SignedURL,
			"created_at": "now()",
		}, false, "", "representation", "exact")
	data, count, err := query.Execute()
	if err != nil {
		log.Printf("[IdentifyFood] Failed to insert into database. err: %v | count: %d | data: %s\n", err, count, string(data))
		http.Error(w, "Failed to write record to database", http.StatusInternalServerError)
		return
	}
	log.Printf("[IdentifyFood] Database insert successful. Response data: %s\n", string(data))

	// write back a response to the frontend as below:
	/*
		{
			"status":"SUBMITTED",
			"id": "record ID from the database for future reference"
		}
	*/
	var rows []map[string]interface{}
	if err := json.Unmarshal(data, &rows); err != nil || len(rows) == 0 {
		log.Printf("[IdentifyFood] Failed to parse database response array. data=%s err=%v\n", string(data), err)
		http.Error(w, "Failed to parse database response", http.StatusInternalServerError)
		return
	}

	idVal, ok := rows[0]["id"].(string)
	if !ok {
		log.Printf("[IdentifyFood] Invalid ID format in database response: %v\n", rows[0]["id"])
		http.Error(w, "Invalid ID format returned", http.StatusInternalServerError)
		return
	}
	log.Printf("[IdentifyFood] Successfully extracted ID: %s\n", idVal)

	response := map[string]string{
		"status": "SUBMITTED",
		"id":     idVal,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
	log.Println("[IdentifyFood] Request completed successfully")
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
	log.Printf("[InferenceWebhook] Received inference result: ID=%s, IdentifiedFoodName=%s\n", payload.ID, payload.IdentifiedFoodName)

	// Update the database with the result from Kaggle
	updateData := map[string]interface{}{
		"identified_food_name": payload.IdentifiedFoodName,
		"status":               "COMPLETED",
	}

	query := db.Client.From("food_identifications").Update(updateData, "", "").Eq("id", payload.ID)
	_, _, err = query.Execute()
	if err != nil {
		http.Error(w, "Failed to update database", http.StatusInternalServerError)
		return
	}
	log.Println("[InferenceWebhook] Database update successful")

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"SUCCESS"}`))
}

func GetInferenceStatus(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "Missing id parameter", http.StatusBadRequest)
		return
	}
	log.Printf("[GetInferenceStatus] Received request for ID: %s\n", id)

	query := db.Client.From("food_identifications").Select("*", "exact", false).Eq("id", id)
	data, _, err := query.Execute()
	if err != nil {
		log.Printf("[GetInferenceStatus] Failed to query database: %v\n", err)
		http.Error(w, "Failed to query database", http.StatusInternalServerError)
		return
	}
	log.Printf("[GetInferenceStatus] Database query successful. Response data: %s\n", string(data))
	var rows []map[string]interface{}
	if err := json.Unmarshal(data, &rows); err != nil || len(rows) == 0 {
		http.Error(w, "Result not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rows[0])
}
