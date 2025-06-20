@echo off
cd almacen
start cmd /k "uvicorn main:app --reload"
start cmd /k "npm start"