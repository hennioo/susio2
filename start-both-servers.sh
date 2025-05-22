#!/bin/bash
echo "Starte UI-Server auf Port 3000..."
node public/custom-workflow.js &
UI_PID=$!

# Gib dem UI-Server einen Moment Zeit zum Starten
sleep 2

echo "Starte API-Server auf Port 10000..."
node server.js &
API_PID=$!

# Warte auf beide Prozesse
wait $UI_PID $API_PID