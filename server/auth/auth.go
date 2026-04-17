package auth

import (
	"server/db"

	"github.com/supabase-community/gotrue-go/types"
)

// defining types for use
type SignupRequest struct {
	Email    string
	Password string
	Data     map[string]interface{}
}

type SigninRequest struct {
	Email    string
	Password string
}

// Creating auth context for cross-application use
type AuthContext struct {
	// adding the auth context functions for use across the application
	Signup  func(req SignupRequest) (*types.SignupResponse, error)
	Signin  func(email, password string) (*types.TokenResponse, error)
	Signout func() error

	// adding the user info for use across the application
	User func() (*types.User, error)
}

// signup
func Signup(req SignupRequest) (*types.SignupResponse, error) {
	var request types.SignupRequest = types.SignupRequest{
		Email:    req.Email,
		Password: req.Password,
		Data:     req.Data,
	}
	resp, err := db.Client.Auth.Signup(request)
	return resp, err
}

// sign in
func Signin(email, password string) (*types.TokenResponse, error) {
	// try signing in with email and password
	resp, err := db.Client.Auth.SignInWithEmailPassword(email, password)
	// set auth context user info for use across the application
	return resp, err
}

// sign out
func Signout() error {
	err := db.Client.Auth.Logout()
	return err
}

func User() (*types.User, error) {
	user, err := db.Client.Auth.GetUser() // get the current user info
	if err != nil {
		return nil, err
	}
	// parse user response to return user info for use across the application
	var userInfo types.User = types.User{
		ID:           user.ID,
		Aud:          user.Aud,
		Role:         user.Role,
		Email:        user.Email,
		Phone:        user.Phone,
		AppMetadata:  user.AppMetadata,
		UserMetadata: user.UserMetadata,
	}
	return &userInfo, nil
}

var Auth *AuthContext = &AuthContext{
	Signup:  Signup,
	Signin:  Signin,
	Signout: Signout,
	User:    User,
}
