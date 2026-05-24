# Diet Planner Frontend

A React-based frontend for the Diet Planner application.

## Features

- **Authentication**: Sign up and sign in with email and password
- **AI Dietician Chat**: Chat with an AI assistant for diet and nutrition advice.
- **Food Identification**: Upload images to identify foods

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

The app will run at `http://localhost:3000`

### Backend Configuration

Make sure the backend server is running on `http://localhost:8080`. You can configure this in the `src/App.js` file.

## Build

```bash
npm build
```

## Project Structure

```
src/
├── components/
│   ├── AuthPage.js         # Login/Signup
│   ├── ChatPage.js         # AI dietician chat
│   ├── Dashboard.js        # Main dashboard
│   ├── FoodIdentifier.js   # Food image identification
├── App.js                  # Main app component
└── index.js               # Entry point
```

## API Endpoints

The frontend communicates with these backend endpoints:

- `POST /signup` - User registration
- `POST /signin` - User login
- `POST /signout` - User logout
- `POST /chat` - Chat with the AI dietician
- `POST /id_food` - Identify food from image
