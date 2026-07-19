package chat

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/ollama/ollama/api"
)

// ref: https://github.com/ollama/ollama/blob/v0.24.0/api/examples/chat/main.go

// the API route handles for chatting with a fine-tuned Gemma 4 model (named dietto-dietician) hosted in Ollama
func SendConversationToOllamaAPI(w http.ResponseWriter, r *http.Request) {
	// send a request to the ollama API using the request body
	os.Setenv("OLLAMA_HOST", "https://tetsuyo-tatragami-1517-dietto-space.hf.space")

	body, err := io.ReadAll(r.Body)

	print("INFO: Received request body: ", string(body))
	if err != nil {
		log.Printf("ERROR: Failed to read request body: %v", err)
		http.Error(w, "Failed to read request body", http.StatusInternalServerError)
		return
	}

	message := string(body)

	// parse the request body as a JSON array of messages
	var messages []api.Message
	err = json.Unmarshal([]byte(message), &messages)
	if err != nil {
		log.Printf("ERROR: Failed to parse request body as JSON: %v", err)
		http.Error(w, "Failed to parse request body as JSON", http.StatusBadRequest)
		return
	}

	log.Printf("Messages: %+v", messages)

	client, err := api.ClientFromEnvironment()
	if err != nil {
		log.Printf("ERROR: Failed to create Ollama client: %v", err)
		http.Error(w, "Failed to create Ollama client", http.StatusInternalServerError)
		return
	}

	ctx := context.Background()
	req := &api.ChatRequest{
		Model:    "SamRubenAbraham/dieto-dietician",
		Messages: messages[1:],
		Options: map[string]interface{}{
			"num_predict": 200,
			"temperature": 0.3,
			"stop":        []string{"<turn|>"},
		},
	}

	// attempting a logging
	log.Printf("INFO: Printing Request Componenets:")
	log.Printf("INFO: Model: %s", req.Model)
	log.Printf("INFO: Messages: %+v", req.Messages)

	var response_parts []string
	respFunc := func(resp api.ChatResponse) error {
		// set the outer variable `response` to the content of the message in the response
		log.Printf("Got response: %s", resp.Message.Content)
		response_parts = append(response_parts, resp.Message.Content)
		return nil
	}

	err = client.Chat(ctx, req, respFunc)
	if err != nil {
		http.Error(w, "Failed to get response from AI assistant: "+err.Error(), http.StatusBadGateway)
		return
	}

	// combine the response parts into a single string
	var response string = ""
	for _, part := range response_parts {
		response += part
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

}
