package main

import (
	"encoding/json"
	"net/http"
	"server/auth"
	"server/db"
	"server/inference"
	"server/mealplanner"

	"github.com/joho/godotenv"
)

// enableCORS is a middleware function that adds CORS headers to the response
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*") // Allow all origins; you can restrict this to "http://localhost:3000" in production
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	// load environment variables from .env file
	godotenv.Load()

	// initialize database client after loading env vars
	db.Init()

	// server logic
	/*----------------------------------------------------*/
	// Authentication routes
	http.HandleFunc("/signup", func(w http.ResponseWriter, r *http.Request) {
		// Handle signup logic
		// Obtain user details from the request body and call the Signup function from the db package
		var req auth.SignupRequest
		// For simplicity, we will assume the request body is in JSON format and contains the necessary fields
		// In a real application, you would need to handle errors and validate the input
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		signupResp, err := auth.Auth.Signup(req)
		if err != nil {
			http.Error(w, "Failed to sign up: "+err.Error(), http.StatusInternalServerError)
			return
		}
		user := signupResp.User

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
	})

	http.HandleFunc("/signin", func(w http.ResponseWriter, r *http.Request) {
		// Handle signin logic
		// Obtain user credentials from the request body and call the Signin function from the db package
		var req auth.SigninRequest
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		signinResp, err := auth.Auth.Signin(req.Email, req.Password)
		if err != nil {
			http.Error(w, "Failed to sign in: "+err.Error(), http.StatusUnauthorized)
			return
		}
		user := signinResp.User

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
	})

	http.HandleFunc("/signout", func(w http.ResponseWriter, r *http.Request) {
		// Handle signout logic
		err := auth.Signout()
		if err != nil {
			http.Error(w, "Failed to sign out: "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	})
	/*----------------------------------------------------*/
	// Inference service route
	http.HandleFunc("/id_food", inference.IdentifyFood)
	http.HandleFunc("/webhook/inference_result", inference.InferenceWebhook)
	/*----------------------------------------------------*/
	// Meal planner routes
	http.HandleFunc("/evaluate", mealplanner.EvaluateMeal)
	http.HandleFunc("/plan", mealplanner.PlanMeal)
	http.HandleFunc("/nutrition", mealplanner.GetNutritionalInfo)
	/*----------------------------------------------------*/
	// Start the server
	http.ListenAndServe(":8080", enableCORS(http.DefaultServeMux))
}
