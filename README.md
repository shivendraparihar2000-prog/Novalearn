# NovaLearn — Personalized Learning Recommendation System

A premium React frontend prototype with 10 distinct pages and an immersive 3D-inspired learning UI.

## Included pages
1. Landing Page
2. Sign Up / Login
3. Student Dashboard
4. Explore Courses
5. Course / Learning View
6. Quiz / Assessment
7. Learner Profile
8. Recommendations
9. Progress Analytics
10. How It Works / About

## Run locally

Install Node.js (LTS), then open a terminal in this folder:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

To make a production build:

```bash
npm run build
npm run preview
```

## What works in this prototype
- Clickable sidebar navigation across the pages.
- Responsive layouts for desktop, tablet, and mobile.
- Course search and topic, difficulty, and format filters.
- Course detail view and lesson completion state.
- Interactive multiple-choice quiz with answer feedback.
- Clickable topic nodes in the learning map and profile mastery list.
- Recommendation cards and match-score visuals.
- Analytics charts using sample data.
- Demo authentication form validation (not real authentication).
- 3D orb scene using React Three Fiber and Drei, plus CSS-based 3D accents.
- Reduced-motion support and visible keyboard focus styles.

## Important production notes
This is a frontend prototype. It uses illustrative sample learner data. To make it production-ready:
- Connect authentication to a secure provider or backend. Never store raw passwords in the browser or database.
- Store users, resources, quiz attempts, progress, and activity events in a backend database.
- Replace demo recommendation scores with a server-side recommendation endpoint.
- Persist course progress and quiz attempts through API calls.
- Add server-side authorization, validation, error handling, and privacy controls.
- Replace sample analytics with data returned by the authenticated learner's activity records.
- Configure production environment variables and deployment settings.

The authentication screen explicitly reports demo mode instead of pretending a real account was created.
