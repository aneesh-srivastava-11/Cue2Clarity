# Deploying Cue2Clarity to Render (Single Service)

This guide explains how to deploy your **Cue2Clarity** application as a **single service** (Backend serving Frontend) on Render.

## Prerequisites

1.  **Push your code to GitHub**: Ensure `build.sh`, `Backend/requirements.txt`, and the modified `Backend/main.py` are pushed.
2.  **Render Account**: Create an account at [render.com](https://render.com).

---

## Option 1: Automatic (Blueprint) - Recommended

1.  Go to Dashboard -> **New+** -> **Blueprint**.
2.  Connect your repo.
3.  Accept the `render.yaml` configuration.
4.  Enter your environment variables (`GOOGLE_API_KEY`, `SUPABASE_URL`, etc.) when prompted.
5.  Click **Apply**.

---

## Option 2: Manual "Web Service" Setup

If you prefer to set it up manually without the `render.yaml` blueprint:

1.  **Create Service**:
    - Go to Dashboard -> **New+** -> **Web Service**.
    - Connect your GitHub repository (`Cue2Clarity`).

2.  **Configure Settings**:
    - **Name**: `cue2clarity` (or whatever you like)
    - **Runtime**: **Python 3**
    - **Build Command**: `chmod +x build.sh && ./build.sh`
    - **Start Command**: `cd Backend && uvicorn main:app --host 0.0.0.0 --port 10000`

3.  **Environment Variables**:
    - Scroll down to "Environment Variables" and add these:
        - `PYTHON_VERSION`: `3.9.0`
        - `NODE_VERSION`: `20.11.0`
        - `GOOGLE_API_KEY`: *(paste from your .env)*
        - `PINECONE_API_KEY`: *(paste from your .env)*
        - `SUPABASE_URL`: *(paste from your .env)*
        - `SUPABASE_KEY`: *(paste from your .env)*
        - `ADMIN_SECRET`: *(paste from your .env)*

4.  **Deploy**:
    - Click **Create Web Service**.

---

## Troubleshooting

- **"Frontend 'dist' directory not found"**: This means the build script failed to build the React app. Check the logs to see if `npm install` or `npm run build` failed.
- **CORS Errors**: Since we are serving frontend and backend from the same domain, you shouldn't see these. If you do, ensure you aren't hardcoding `localhost:8000` in your frontend code.
