echo "Testing Pastebin-Lite API..."
echo "=============================="

echo "1. Health check:"
curl -s http://localhost:3000/api/healthz
echo ""
echo ""

echo "2. Creating a paste:"
curl -s -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":"This is a test paste","ttl_seconds":60,"max_views":3}' | python3 -m json.tool
echo ""
echo ""

echo "3. Getting the paste (replace PASTE_ID with actual ID from above):"
echo "Visit http://localhost:3000 in browser and create a paste to get the ID"
echo "Then run: curl http://localhost:3000/api/pastes/YOUR_PASTE_ID"
