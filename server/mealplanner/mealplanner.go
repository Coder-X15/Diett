package mealplanner

import (
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
func EvaluateMeal(w http.ResponseWriter, r *http.Request) {}

// plan a meal for a day based on the user's dietary restrictions and preferences
func PlanMeal(w http.ResponseWriter, r *http.Request) {}

// get the nutritional information for a meal
func GetNutrition(w http.ResponseWriter, r *http.Request) {}
