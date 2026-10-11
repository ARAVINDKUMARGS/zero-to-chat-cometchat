# Publishing DevConnect to GitHub

## One-time check: make sure no secrets will be uploaded
From the project root:
```bash
git init
git add .
git status
```
Look at the list. You must **not** see `server/.env`. You *should* see `server/.env.example`.
Extra safety check:
```bash
git ls-files | grep -i "\.env"
```
Expected output: only `server/.env.example`.

## Commit
```bash
git commit -m "DevConnect: real-time developer collaboration hub (CometChat)"
git branch -M main
```

## Create the repository
1. Go to https://github.com/new
2. Name: `devconnect`. Leave "Add README / .gitignore / license" **unchecked** (we already have them).
3. Click **Create repository**.

## Push
Copy the two lines GitHub shows you, they look like this (use YOUR username):
```bash
git remote add origin https://github.com/YOUR_USERNAME/devconnect.git
git push -u origin main
```

## If you ever pushed a key by accident
Deleting the file is not enough (it stays in git history). Go to the CometChat dashboard, **rotate/regenerate the REST API Key**, and update `server/.env`.

## Before submitting
- README renders correctly on GitHub
- Repo is public (if the hackathon requires it)
- Add your deployed URL or demo video link to the top of the README
