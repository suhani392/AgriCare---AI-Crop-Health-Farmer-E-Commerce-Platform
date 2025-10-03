
# AgriBazaar - AI Crop Health & Farmer E-Commerce Platform

AgriBazaar is a modern web application designed to assist farmers in India by leveraging AI for crop disease diagnosis and providing a platform for accessing localized farming information and an e-commerce marketplace for agricultural products. It also includes robust user management and expert review systems.

## Table of Contents

1.  [Key Features](#key-features)
2.  [Technology Stack](#technology-stack)
3.  [Dependencies & Build Tools](#dependencies--build-tools)
4.  [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Firebase Setup](#firebase-setup)
    *   [Environment Variables](#environment-variables)
    *   [Installation](#installation)
    *   [Running the Application](#running-the-application)
5.  [Firebase Configuration Notes](#firebase-configuration-notes)
    *   [Authentication: Authorized Domains](#authentication-authorized-domains)
    *   [Firestore: Security Rules](#firestore-security-rules)
6.  [Folder Structure](#folder-structure)
7.  [Available Scripts](#available-scripts)
8.  [Contributing](#contributing)
9.  [License](#license)

## Key Features

*   **User Authentication:** Secure sign-up and login using Email/Password and Google Sign-In.
*   **Role-Based Access Control (RBAC):**
    *   **Farmer:** Access to core features like diagnosis, product browsing, chatbot, and local info.
    *   **Expert:** Can review diagnoses flagged by farmers and provide expert opinions.
    *   **Admin:** Full access to user management, expert query management, and other administrative functions.
*   **AI Crop Disease Diagnosis:**
    *   Upload an image of an affected crop.
    *   Receive an AI-powered diagnosis identifying potential diseases.
    *   Get treatment recommendations.
    *   Option to request an expert review if not satisfied with the AI diagnosis.
*   **AI-Powered Preventative Measures:** Generate preventative measures for crops based on type, season, and location in India.
*   **Localized Farming Tips:** Access AI-generated farming tips tailored to specific Indian locations and current (mock) weather conditions.
*   **AI Chatbot Support:** An interactive chatbot (currently with mock responses) to answer farming-related queries.
*   **E-commerce for Farming Products:**
    *   Browse a catalog of agricultural products (seeds, fertilizers, equipment, etc.).
    *   Filter products by category and search by name.
    *   (Note: Cart and checkout functionality are not yet implemented).
*   **Admin Panel:** A comprehensive dashboard for platform management.
    *   **User Management:**
        *   View all registered users, their roles, and registration dates.
        *   Assign or change user roles (e.g., promote a user to 'expert').
        *   Activate, deactivate, or delete user accounts.
        *   (Future Scope) Approve expert registrations.
    *   **Expert Query Management:**
        *   View and manage diagnosis queries flagged by users for expert assessment. Admins (and Experts) can submit their diagnosis and comments.
    *   **Product & Marketplace Oversight:**
        *   Manage marketplace categories (e.g., seeds, tools, pesticides).
        *   (Future Scope) Review and approve products listed by farmers.
        *   (Future Scope) Flag or remove inappropriate listings.
    *   **Content & Consultation Control (Future Scope):**
        *   Approve or remove expert advice, articles, and content.
        *   Moderate Q&A sections and monitor consultation logs.
    *   **Reports & Analytics:**
        *   View dashboard with live metrics (user growth, query counts, etc.).
        *   (Future Scope) Generate detailed reports on sales, active users, and trends.
    *   **Feedback & Complaint Resolution (Future Scope):**
        *   View and manage user-submitted feedback and resolve issues.
    *   **Policy & Data Management (Future Scope):**
        *   Manage curated knowledgebase and seed data (e.g., crop types, soil categories).
    *   **System Settings (Future Scope):**
        *   Manage system-wide parameters and third-party integrations.
*   **Expert Dashboard:** Dedicated section for users with the 'expert' role to review and respond to farmer queries.
*   **Responsive Design:** UI adaptable to various screen sizes.
*   **Toast Notifications:** For user feedback on actions.

## Technology Stack

*   **Framework:** [Next.js](https://nextjs.org/) (v15 with App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **UI Library:** [React](https://reactjs.org/)
*   **Component Library:** [ShadCN UI](https://ui.shadcn.com/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Generative AI:** [Genkit (by Google)](https://firebase.google.com/docs/genkit)
    *   **AI Models:** Google AI - Gemini family (e.g., Gemini 2.0 Flash)
*   **Backend & Database:** [Firebase](https://firebase.google.com/)
    *   **Authentication:** Firebase Authentication
    *   **Database:** Firestore (NoSQL)
    *   **Hosting (Implied):** Firebase App Hosting (configured in `apphosting.yaml`)
*   **State Management (Client-side):**
    *   React Context API (for Authentication state via `AuthContext`)
    *   React Hook Form (for form validation and management)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Date Utilities:** [date-fns](https://date-fns.org/)
*   **Linting/Formatting:** ESLint, Prettier (implicitly, via Next.js defaults)

## Dependencies & Build Tools

*   **Runtime Environment:** [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   **Package Manager:** [npm](https://www.npmjs.com/) (comes with Node.js) - Used for managing project dependencies and running scripts.

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   [npm](https://www.npmjs.com/) (or [yarn](https://yarnpkg.com/) if preferred, though scripts use npm)

### Firebase Setup

1.  **Create a Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project (or use an existing one).
2.  **Add a Web App:** In your Firebase project, add a new Web application.
3.  **Get Firebase Configuration:** Copy the Firebase SDK configuration snippet (apiKey, authDomain, etc.).
4.  **Update Firebase Config File:** Paste your Firebase configuration into `src/lib/firebase/config.ts`.
5.  **Enable Firebase Services:**
    *   **Authentication:** Enable Email/Password and Google Sign-In providers in the Firebase Console (Authentication > Sign-in method).
    *   **Firestore:** Create a Firestore database in Native mode.
6.  **Authorized Domains:** For Google Sign-In and other authentication methods to work during local development, add `localhost` to the list of authorized domains in Firebase Console (Authentication > Settings > Authorized domains). For production, add your deployed app's domain.
7.  **Firestore Security Rules:** Set up Firestore security rules. A comprehensive set of rules tailored for this application has been discussed during development. Ensure these are published in Firebase Console (Firestore Database > Rules). See [Firebase Configuration Notes](#firestore-security-rules) for more details.

### Environment Variables

This project uses a `.env` file for environment variables. Currently, it's primarily used by Genkit for Google AI API keys if not configured elsewhere.
Create a `.env` file in the root of the project:
```env
# Example for Genkit, if you have a specific API key for Google AI Studio
# GOOGLE_API_KEY=YOUR_GOOGLE_AI_API_KEY
```
The `src/ai/genkit.ts` file is configured to use `googleai/gemini-2.0-flash` which typically doesn't require an explicit API key when running in a Google Cloud environment or with `gcloud auth application-default login`. If you encounter issues, ensure your Genkit environment is correctly authenticated with Google Cloud.

### Installation

Clone the repository and install the dependencies:
```bash
git clone <your-repository-url>
cd agricheck-project # Or your project directory name
npm install
```

### Running the Application

The application consists of two main parts: the Next.js frontend and the Genkit development server for AI flows.

1.  **Start the Next.js Development Server:**
    ```bash
    npm run dev
    ```
    This will typically start the app on `http://localhost:9002`.

2.  **Start the Genkit Development Server:**
    Open a new terminal window/tab and run:
    ```bash
    npm run genkit:dev
    # or for auto-reloading on changes to AI flows:
    # npm run genkit:watch
    ```
    This usually starts the Genkit server on `http://localhost:3400` (Genkit UI) and makes the AI flows available for the Next.js app.

You need both servers running to use the AI-powered features.

## Firebase Configuration Notes

### Authentication: Authorized Domains

For Google Sign-In (and potentially other OAuth providers) to work correctly:
*   During local development (e.g., `http://localhost:9002`), ensure `localhost` is added to your Firebase project's "Authorized domains" list (Firebase Console > Authentication > Settings).
*   When deploying to production, add your production domain (e.g., `your-app.web.app` or custom domain) to this list.

### Firestore: Security Rules

Proper Firestore security rules are **critical** for protecting your application's data. The application's functionality relies on rules that grant specific permissions based on user roles (farmer, expert, admin).
A comprehensive set of rules should be in place, covering:
*   Users can manage their own profiles.
*   Admins can list all users and modify user roles.
*   Experts and Admins can access and update diagnosis queries for review.
*   Users can manage their own diagnosis history and chat messages.

Refer to the rules provided and discussed during development. Always test your rules thoroughly using the Firebase Console Simulator.

## Folder Structure

A brief overview of the main directories:

*   `src/app/`: Contains all the Next.js App Router pages and layouts.
    *   `src/app/(auth)/`: Route group for authentication-related pages (login, signup).
    *   `src/app/admin/`: Admin panel pages.
    *   `src/app/api/`: API routes (if any - current project uses Server Actions more).
    *   `src/app/diagnose/`, `src/app/products/`, etc.: Feature-specific pages.
*   `src/ai/`: Genkit related files.
    *   `src/ai/flows/`: Genkit flow definitions (e.g., `diagnose-crop-disease.ts`).
    *   `src/ai/genkit.ts`: Genkit global AI instance configuration.
    *   `src/ai/dev.ts`: Genkit development server entry point.
*   `src/components/`: Shared React components.
    *   `src/components/layout/`: Layout components like Header and Footer.
    *   `src/components/ui/`: ShadCN UI components.
*   `src/contexts/`: React Context providers (e.g., `AuthContext.tsx`).
*   `src/hooks/`: Custom React hooks (e.g., `useToast.ts`).
*   `src/lib/`: Core logic, utilities, and Firebase integration.
    *   `src/lib/actions.ts`: Next.js Server Actions.
    *   `src/lib/firebase/`: Firebase configuration, authentication, and Firestore service files.
    *   `src/lib/mock-data.ts`: Mock data for features like products.
    *   `src/lib/utils.ts`: Utility functions like `cn` for Tailwind.
*   `src/types/`: TypeScript type definitions (`index.ts`).
*   `public/`: Static assets.

## Available Scripts

In the `package.json` file, you can find the following scripts:

*   `npm run dev`: Starts the Next.js development server (with Turbopack) on port 9002.
*   `npm run genkit:dev`: Starts the Genkit development server.
*   `npm run genkit:watch`: Starts the Genkit development server with file watching for AI flows.
*   `npm run build`: Builds the Next.js application for production.
*   `npm run start`: Starts the Next.js production server (after building).
*   `npm run lint`: Runs ESLint.
*   `npm run typecheck`: Runs TypeScript compiler for type checking.

## Contributing

Contributions are welcome! Please follow standard coding practices, ensure your code is well-tested, and create a pull request for review. (Further contribution guidelines can be added here).

## License

This project is licensed under the MIT License. (Or specify your chosen license).
