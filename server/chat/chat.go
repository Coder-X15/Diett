package chat

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/ollama/ollama/api"
)

// setting the ollama API URL from environment variable
var ollamaApi string = os.Getenv("OLLAMA_KEY")

// ref: https://github.com/ollama/ollama/blob/v0.24.0/api/examples/chat/main.go

// the API route handles for chatting with a fine-tuned Gemma 4 model (named dietto-dietician) hosted in Ollama
func SendConversationToOllamaAPI(w http.ResponseWriter, r *http.Request) {
	// send a request to the ollama API using the request body
	var chatMessages []api.Message // the result from the ollama API will be a chat message
	bodyBytes, _ := io.ReadAll(r.Body)
	err := json.Unmarshal(bodyBytes, &chatMessages)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	client, err := api.ClientFromEnvironment()
	if err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()

	// create the chat request
	req := &api.ChatRequest{
		Model:    "SamRubenAbraham/dietto-dietician",
		Messages: chatMessages,
	}

	respFunc := func(resp api.ChatResponse) error {
		// write the response back into the HTTP response writer in the api.Message format (role, content)
		response := resp.Message
		responseBytes, err := json.Marshal(response)
		if err != nil {
			return fmt.Errorf("failed to marshal response: %w", err)
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(responseBytes)
		w.(http.Flusher).Flush()
		return nil
	}

	err = client.Chat(ctx, req, respFunc)
	if err != nil {
		log.Fatal(err)
	}
}
