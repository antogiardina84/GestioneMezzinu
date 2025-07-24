@echo off
cd /d C:\GestioneMezzi

:: Avvia il backend
start "Backend" cmd /k "cd backend && node server.js"


exit