package main

import (
	"encoding/json"
	"net/http"
	"server/db"
	"server/inference"
)

func main() {

	// server logic
	/*----------------------------------------------------*/
	// Authentication routes
	http.HandleFunc("/signup", func(w http.ResponseWriter, r *http.Request) {
		// Handle signup logic
		// Obtain user details from the request body and call the Signup function from the db package
		var req db.SignupRequest
		// For simplicity, we will assume the request body is in JSON format and contains the necessary fields
		// In a real application, you would need to handle errors and validate the input
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		session := db.Signup(req)
		json.NewEncoder(w).Encode(session)
	})

	http.HandleFunc("/signin", func(w http.ResponseWriter, r *http.Request) {
		// Handle signin logic
		// Obtain user credentials from the request body and call the Signin function from the db package
		var req db.SigninRequest
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		session := db.Signin(req.Email, req.Password)
		json.NewEncoder(w).Encode(session)
	})

	http.HandleFunc("/signout", func(w http.ResponseWriter, r *http.Request) {
		// Handle signout logic
		db.Signout()
		w.WriteHeader(http.StatusOK)
	})
	/*----------------------------------------------------*/
	// Inference service route
	http.HandleFunc("/infer", inference.Infer)
	http.ListenAndServe(":8080", nil)
}
