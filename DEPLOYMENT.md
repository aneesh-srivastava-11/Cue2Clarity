# Deploying Cue2Clarity to Render (Single Service)

This guide explains how to deploy your **Cue2Clarity** application as a **single service** (Backend serving Frontend) on Render.

## Prerequisites

1.  **Push your code to GitHub**: Ensure the following files are committed and pushed:
    - `render.yaml`
    - `build.sh`
    - `Backend/requirements.txt`
    - Modified `Backend/main.py`
2.  **Render Account**: Create an account at [render.com](https://render.com).

## Step 1: Create Blueprint

1.  Go to your [Render Dashboard](https://dashboard.render.com/).
2.  Click **"New+"** -> **"Blueprint"**.
3.  Connect your repository (Cue2Clarity).
4.  Render will detect the `render.yaml`.

## Step 2: Configure Environment Variables

Fill in your secrets from your local `.env`. Key variables needed: `GOOGLE_API_KEY`, `PINECONE_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`, `ADMIN_SECRET`.

## Step 3: Deploy

1.  Click **"Apply"**.
2.  Render will:
    - Run `build.sh`: Builds the React app and installs Python deps.
    - Start the server using `uvicorn`.
3.  Wait for the process to finish.

## Step 4: Verify

1.  Click the URL provided by Render (e.g., `https://cue2clarity.onrender.com`).
2.  You should see your Frontend.
3.  Any API calls will go to the same domain (e.g., `/chat` or `/upload`), avoiding CORS issues.

**Troubleshooting:**
- If you see "Frontend 'dist' directory not found" in logs, check if the build step ran successfully.
- Check the "Logs" tab in Render for any errors.
