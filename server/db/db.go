package db

import (
	"os"

	"github.com/supabase-community/supabase-go"
)

// load environment variables from system
var supabaseUrl string
var supabaseKey string

// internal methods to simplify logic
// create client for Supabase interactions
func getClient() *supabase.Client {
	client, err := supabase.NewClient(supabaseUrl, supabaseKey, nil)
	if err != nil {
		panic(err)
	}
	return client
}

// client for use - initialized in main.go after loading .env
var Client *supabase.Client

// Initialize the database client
func Init() {
	supabaseUrl = os.Getenv("SUPABASE_URL")
	supabaseKey = os.Getenv("SUPABASE_KEY")
	Client = getClient()
}
