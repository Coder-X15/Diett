# Diet Planner Frontend

A React-based frontend for the Diet Planner application.

## Features

- **Authentication**: Sign up and sign in with email and password
- **Food Identification**: Upload images to identify foods
- **Meal Planning**: Plan and evaluate daily meals
- **Nutrition Information**: Get nutritional details for any meal

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
│   ├── Dashboard.js        # Main dashboard
│   ├── FoodIdentifier.js   # Food image identification
│   ├── MealPlanner.js      # Meal planning and evaluation
│   └── NutritionInfo.js    # Nutritional information lookup
├── App.js                  # Main app component
└── index.js               # Entry point
```

## API Endpoints

The frontend communicates with these backend endpoints:

- `POST /signup` - User registration
- `POST /signin` - User login
- `POST /signout` - User logout
- `POST /id_food` - Identify food from image
- `POST /plan` - Plan meals for a day
- `POST /evaluate` - Evaluate meals against dietary restrictions
- `POST /nutrition` - Get nutritional information
