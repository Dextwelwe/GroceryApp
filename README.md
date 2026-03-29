# GroceryApp

A simple grocery list app to create, manage, and share shopping lists. Built with React and Firebase.

**Live demo:** https://dextwelwe.github.io/GroceryApp

## Features

- **Grocery lists** — Create personal or shared grocery lists with a name and optional date
- **Share lists** — Invite other users by email to collaborate on a grocery list
- **Smart item suggestions** — Start typing and get autocomplete suggestions from a database of 400+ grocery items across 11 categories
- **Auto-categorization** — Items are automatically assigned a category (produce, meat, dairy, bakery, pantry, frozen, seafood, snacks & drinks, household, personal care, pets)
- **Recipes** — Save reusable recipes (ingredient lists) and quickly add them to any grocery list
- **Custom categories & stores** — Add your own custom categories and store labels to items
- **Filters & sorting** — Filter by category, store, status (active/completed), recipe, and sort A-Z or by date
- **Mark items done** — Check off items as you shop; mark entire lists as completed
- **Real-time multiuser sync** — Lists update instantly for all users sharing the same grocery list. Multiple users can collaborate and see changes live, with no refresh needed (powered by Firestore real-time updates).
- **Multilingual** — Full support for English, French, and Russian
- **Guest login** — Try the app without creating an account
- **Mobile-friendly** — Responsive design for use on the go

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 |
| Backend / DB | Firebase (Firestore + Auth) |
| Localization | i18next / react-i18next |
| Styling | CSS Modules |
| Hosting | GitHub Pages |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

You'll need a `.env` file with your Firebase config:

```
REACT_APP_API_FIREBASE_KEY=...
REACT_APP_API_FIREBASE_AUTH_DOMAIN=...
REACT_APP_API_FIREBASE_PROJECT_NAME=...
REACT_APP_API_FIREBASE_APP_ID=...
REACT_APP_GUEST_NAME=...
REACT_APP_GUEST_PASSWORD=...
```

## Project Structure

```
src/
	api/          — Firebase auth, Firestore CRUD (groceries, items, recipes, users)
	assets/       — Fonts, icons, images
	components/   — Reusable UI components (cards, popups, filters, header, etc.)
	data/         — Grocery items database (400+ items, EN/FR/RU)
	hooks/        — Custom hooks (category search, local storage, image preload)
	localisation/ — Translation files (en, fr, ru)
	models/       — Grocery and User data models
	pages/        — Main pages (login, groceries list, single grocery)
	providers/    — Auth context provider
	utils/        — Helper functions
```