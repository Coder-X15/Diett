package inference

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
)

// setting the inference API URL from environment variable
var inferenceAPi string = os.Getenv("INFERENCE_API")

type InferenceRequest struct {
	Image string `json:"image"`
}

func Infer(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	} else {
		// parse the request body and forward it to the inference API
		// parse the image input in the request and forward it to the inference API

		// ensure the request body has an image argument
		var req InferenceRequest
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// make a POST request to the inference API with the request body
		resp, err := http.Post(inferenceAPi, "application/json", r.Body)
		if err != nil {
			http.Error(w, "Failed to call inference API", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close() // ensure the response body is closed after reading

		// write the response from the inference API back to the client
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(resp.StatusCode)
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			http.Error(w, "Failed to read response", http.StatusInternalServerError)
			return
		}
		if _, err := w.Write(body); err != nil {
			http.Error(w, "Failed to write response", http.StatusInternalServerError)
			return
		}
	}
}
