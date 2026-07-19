package mealplanner

import (
	"encoding/json"
	"net/http"
	"server/db"
	"strings"
)

// MealItems is a custom type to handle unmarshalling meal items that could be
// either a JSON array of strings (current format) or a single comma-separated
// string (legacy format).
type MealItems []string

// UnmarshalJSON implements the json.Unmarshaler interface for MealItems.
func (m *MealItems) UnmarshalJSON(data []byte) error {
	// First, try to unmarshal as a string array, which is the expected modern format.
	var s []string
	if err := json.Unmarshal(data, &s); err == nil {
		*m = s
		return nil
	}

	// If that fails, try to unmarshal as a single string (for legacy data).
	var str string
	if err := json.Unmarshal(data, &str); err != nil {
		// If it's neither a string array nor a string, it's an unmarshalling error.
		return err
	}

	// Handle if the string is a PostgreSQL array literal like "[item1,item2]".
	if strings.HasPrefix(str, "[") && strings.HasSuffix(str, "]") {
		str = strings.Trim(str, "[]")
	}

	// If the string is empty after potential trimming, return an empty slice.
	if strings.TrimSpace(str) == "" {
		*m = []string{}
		return nil
	}

	// Split the string by comma. This handles both legacy comma-separated strings
	// and the content of a pg array literal.
	parts := strings.Split(str, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		// PostgreSQL text arrays can have quoted elements, so we unquote them.
		unquoted := strings.Trim(trimmed, "\"")
		if unquoted != "" {
			result = append(result, unquoted)
		}
	}
	*m = result
	return nil
}

// struct to represent a meal plan for a day
type Mealplan struct {
	UserID    string   `json:"user_id"`
	Day       string   `json:"day"`
	Breakfast []string `json:"breakfast"`
	Lunch     []string `json:"lunch"`
	Dinner    []string `json:"dinner"`
}

// get meal plans for user from the database and return as JSON response
func GetMealPlans(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		http.Error(w, "Missing user_id query parameter", http.StatusBadRequest)
		return
	}

	rawJSON, count, err := db.Client.From("meal_plans").Select("*", "exact", false).Eq("user_id", userID).Execute()
	if err != nil {
		http.Error(w, "Failed to fetch meal plans: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if count == 0 {
		// The frontend handles a 404, but returning an empty array is also a valid approach.
		http.Error(w, "No meal plans found for user", http.StatusNotFound)
		return
	}

	// The database returns 'day_of_week', but the frontend expects 'day'.
	// We need to unmarshal, transform, and re-marshal the data.
	type dbPlan struct {
		UserID    string    `json:"user_id"`
		Day       string    `json:"day_of_week"`
		Breakfast MealItems `json:"breakfast"`
		Lunch     MealItems `json:"lunch"`
		Dinner    MealItems `json:"dinner"`
	}
	var dbPlans []dbPlan
	if err := json.Unmarshal(rawJSON, &dbPlans); err != nil {
		http.Error(w, "Failed to parse database response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Transform to the frontend model (Mealplan struct)
	fePlans := make([]Mealplan, len(dbPlans))
	for i, p := range dbPlans {
		fePlans[i] = Mealplan{
			UserID:    p.UserID,
			Day:       p.Day,       // Map day_of_week to day
			Breakfast: p.Breakfast, // MealItems is type-compatible with []string
			Lunch:     p.Lunch,
			Dinner:    p.Dinner,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(fePlans)
}

func SaveMealPlan(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var mealplan Mealplan
	err := json.NewDecoder(r.Body).Decode(&mealplan)
	if err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	// The database uses 'day_of_week', so we build a map for the upsert.
	upsertData := map[string]interface{}{
		"user_id":     mealplan.UserID,
		"day_of_week": mealplan.Day,
		"breakfast":   mealplan.Breakfast,
		"lunch":       mealplan.Lunch,
		"dinner":      mealplan.Dinner,
	}

	// Use Insert with upsert=true. 'onConflict' specifies the unique key for conflict resolution.
	_, _, err = db.Client.From("meal_plans").
		Insert(upsertData, true, "user_id,day_of_week", "", "exact").
		Execute()

	if err != nil {
		http.Error(w, "Failed to save meal plan: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}
