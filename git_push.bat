@echo off
git add .
git commit --allow-empty -m "re-deploy: trigger Vercel deployment with latest padding and layout fixes"
git push
