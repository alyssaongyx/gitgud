#!/bin/bash

# GitGud Backend API Test Script
BASE_URL="http://localhost:3000"

echo "🧪 Testing GitGud Backend API"
echo "================================"
echo ""

# Test 1: Root endpoint
echo "1️⃣  Testing GET / (Root endpoint)"
curl -s "$BASE_URL/" | jq '.' || curl -s "$BASE_URL/"
echo -e "\n"

# Test 2: Health check
echo "2️⃣  Testing GET /health"
curl -s "$BASE_URL/health" | jq '.' || curl -s "$BASE_URL/health"
echo -e "\n"

# Test 3: Roast endpoint
echo "3️⃣  Testing POST /roast (this may take a few seconds...)"
curl -s -X POST "$BASE_URL/roast" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "itstrueitstrueitsrealitsreal",
    "intensity": "mild",
    "includeReadme": false,
    "maxRepos": 3
  }' | jq '.' || curl -s -X POST "$BASE_URL/roast" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "itstrueitstrueitsrealitsreal",
    "intensity": "mild",
    "includeReadme": false,
    "maxRepos": 3
  }'
echo -e "\n"

# Test 4: TTS endpoint (requires text from a roast first)
echo "4️⃣  Testing POST /tts"
echo "Note: This requires a valid voiceId. Using a default voice..."
curl -s -X POST "$BASE_URL/tts" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test of the text to speech endpoint.",
    "voiceId": "21m00Tcm4TlvDq8ikWAM",
    "modelId": "eleven_multilingual_v2"
  }' --output /tmp/test-audio.mp3 && echo "✅ Audio saved to /tmp/test-audio.mp3" || echo "❌ TTS request failed"
echo -e "\n"

echo "✅ Testing complete!"
