@echo off
git checkout staging
git merge dev
git push origin staging
