package mealplanner

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
)

// struct to represent a meal plan for a day
type Mealplan struct {
	Day       string   `json:"day"`
	Breakfast []string `json:"breakfast"`
	Lunch     []string `json:"lunch"`
	Dinner    []string `json:"dinner"`
}

// struct to represent the nutritional information for a meal
type Nutrition struct {
	Calories int `json:"calories"`
	Protein  int `json:"protein"`
	Carbs    int `json:"carbs"`
	Fat      int `json:"fat"`
}

// setting the meal planner API URL from environment variable
var mealPlannerApi string = os.Getenv("MEAL_PLANNER_API")

// intended functions:
// 1. Given a meal, the API should be able to prune the meal to fit in the user's dietary restrictions and preferences
// 2. Given a list of available meals, the API should be able to plan a meal for a day based on the user's dietary
// 	  restrictions and preferences
// 3. Given a meal, the API should be able to provide the nutritional information for the meal

// evaluate a meal against the user's dietary restrictions

// just declaring two methods for reuse

func SendRequestToMealPlannerAPI(endpoint string, w http.ResponseWriter, r *http.Request) {
	// send a request to the meal planner API using the request body
	var mealplan Mealplan // the result from the meal planner API will be a meal plan for a day
	bodyBytes, _ := io.ReadAll(r.Body)
	err := json.Unmarshal(bodyBytes, &mealplan)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// make a POST request to the meal planner API with the request body
	resp, err := http.Post(mealPlannerApi+endpoint, "application/json", bytes.NewBuffer(bodyBytes))
	if err != nil {
		http.Error(w, "Failed to call meal planner API", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close() // ensure the response body is closed after reading

	// write the response from the meal planner API back to the client
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	if err := json.NewEncoder(w).Encode(mealplan); err != nil {
		http.Error(w, "Failed to write response", http.StatusInternalServerError)
		return
	}
}

func EvaluateMeal(w http.ResponseWriter, r *http.Request) {
	SendRequestToMealPlannerAPI("/evaluate", w, r)
}

// plan a meal for a day based on the user's dietary restrictions and preferences
func PlanMeal(w http.ResponseWriter, r *http.Request) {
	SendRequestToMealPlannerAPI("/plan", w, r)
}

// get the nutritional information for a meal
func GetNutritionalInfo(w http.ResponseWriter, r *http.Request) {
	// send a request to the meal planner API using the request body
	var mealplan Mealplan // the result from the meal planner API will be a meal plan for a day
	bodyBytes, _ := io.ReadAll(r.Body)
	err := json.Unmarshal(bodyBytes, &mealplan)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// make a POST request to the meal planner API with the request body
	resp, err := http.Post(mealPlannerApi+"/nutrition", "application/json", bytes.NewBuffer(bodyBytes))
	if err != nil {
		http.Error(w, "Failed to call meal planner API", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close() // ensure the response body is closed after reading

	// write the response from the meal planner API back to the client
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Failed to read response", http.StatusInternalServerError)
		return
	}
	if _, err := w.Write(respBody); err != nil {
		http.Error(w, "Failed to write response", http.StatusInternalServerError)
		return
	}
}
