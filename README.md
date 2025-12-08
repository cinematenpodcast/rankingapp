# RankMyWatch

A React application to rank movies and TV series using a binary search insertion sort for efficiency. Includes OMDB/TMDB integration for posters and Firebase Firestore for persistence.

## 🚀 Getting Started

1.  **Install dependencies**
    ```bash
    npm install
    ```

2.  **Add API Keys**
    Open `constants.ts` and ensure your `OMDB_API_KEY` and `TMDB_API_TOKEN` are set.
    *(Note: OMDB key is included in the demo code, but you should use your own TMDB Token for high-res images)*.

3.  **Setup Firebase** (See instructions below)

4.  **Run the App**
    ```bash
    npm run dev
    ```

## 🔥 Firebase Firestore Setup

This app uses Firebase Firestore to save your ranking lists so you don't lose progress on refresh.

### 1. Create a Firebase Project
1.  Go to [console.firebase.google.com](https://console.firebase.google.com/).
2.  Click **"Add project"** and follow the steps.

### 2. Create a Web App
1.  In your project dashboard, click the **Web icon (</>)** to register an app.
2.  Give it a name (e.g., "RankMyWatch").
3.  Copy the **firebaseConfig** object presented to you.

### 3. Configure the Code
1.  Open `services/firebase.ts`.
2.  Replace the `firebaseConfig` object with the one you copied:
    ```typescript
    const firebaseConfig = {
      apiKey: "AIzaSy...",
      authDomain: "...",
      projectId: "...",
      storageBucket: "...",
      messagingSenderId: "...",
      appId: "..."
    };
    ```

### 4. Setup Firestore Database
1.  In the Firebase Console menu, click **Build > Firestore Database**.
2.  Click **Create Database**.
3.  Choose a location near you.
4.  **Security Rules**: For testing, start in **Test Mode** (allows reads/writes for 30 days).
    *   *Warning: In a real production app, you should add Authentication and restrict rules.*

### 5. Create Collection (Optional)
The app will automatically create a collection named `rankings` when you rank your first item. You don't need to manually create it.

## 🛠️ Usage

*   **Rank Tab**: Shows you a new item vs an existing item.
    *   Click **YES** if the New item is BETTER (Rank #1 is best).
    *   Click **NO** if the New item is WORSE.
    *   The app uses binary search, so it will jump around the list to find the exact spot quickly.
*   **Categories**: Switch between Movies (Blue) and TV Series (Pink) using the header button.
*   **Lists**: View full rankings, Top 5, or Bottom 5.

## 🎬 Poster Data
The app attempts to fetch posters using:
1.  **OMDB**: To get the IMDB ID from the Title.
2.  **TMDB**: To get the high-quality poster path using the IMDB ID.
