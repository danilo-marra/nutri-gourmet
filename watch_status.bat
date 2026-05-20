@echo off
:loop
curl -s https://espaco-dialogico.vercel.app/api/v1/status | jq
timeout /t 1 > nul
goto loop
