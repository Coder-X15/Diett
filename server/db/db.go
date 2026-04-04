package db

import (
	"os"

	"github.com/supabase-community/gotrue-go/types"
	"github.com/supabase-community/supabase-go"
)

// load environment variables from system
var supabaseUrl string = os.Getenv("SUPABASE_URL")
var supabaseKey string = os.Getenv("SUPABASE_KEY")

// internal methods to simplify logic
// create client for Supabase interactions
func getClient() *supabase.Client {
	client, err := supabase.NewClient(supabaseUrl, supabaseKey, nil)
	if err != nil {
		panic(err)
	}
	return client
}

// client for use
var client *supabase.Client = getClient()

// intended functions (templates for future implementation):
// 1. Signup/ signin / signout
// 2. Retrieve nutritional information for a given food item
// 3. Store and retreive app settings for user
// 4. Log user's diet

// defining types for use
type SignupRequest struct {
	Email    string
	Phone    string
	Password string
	Data     map[string]interface{}
}

type SigninRequest struct {
	Email    string
	Password string
}

// signup
func Signup(req SignupRequest) *types.SignupResponse {
	var request types.SignupRequest = types.SignupRequest{
		Email:    req.Email,
		Phone:    req.Phone,
		Password: req.Password,
		Data:     req.Data,
	}
	session, err := client.Auth.Signup(request)
	if err != nil {
		panic(err)
	}
	return session
}

// sign in
func Signin(email, password string) types.Session {
	session, err := client.SignInWithEmailPassword(email, password)
	if err != nil {
		panic(err)
	}
	return session
}

// sign out
func Signout() {
	client.Auth.Logout()
}

func GetNutritionalInfo() {}

func StoreAppSettings() {}

func RetrieveAppSettings() {}
