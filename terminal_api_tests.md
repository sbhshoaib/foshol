# Terminal API Tests for Foshol

You can run these commands directly in your terminal (Command Prompt, PowerShell, or Git Bash) to test the API endpoints. 

**Important Notes:**
1. These commands assume your backend is running at `http://localhost/foshol/public/api`. If you are using `php artisan serve`, replace that URL with `http://localhost:8000/api`.
2. For any command requiring authentication, you must run the **User Registration** or **Login** command first, copy the `access_token` from the response, and replace `YOUR_TOKEN_HERE` in the subsequent commands with that token.

---

### 1. User Registration
Creates a new user and returns an `access_token`.
```bash
curl.exe -X POST http://localhost/foshol/public/api/register -H "Content-Type: application/json" -H "Accept: application/json" -d "{\"name\":\"Terminal User\", \"email\":\"terminal1@example.com\", \"password\":\"password123\", \"password_confirmation\":\"password123\"}"
```

### 2. User Login
Logs in the user and returns a fresh `access_token`.
```bash
curl.exe -X POST http://localhost/foshol/public/api/login -H "Content-Type: application/json" -H "Accept: application/json" -d "{\"email\":\"terminal1@example.com\", \"password\":\"password123\"}"
```

### 3. Invalid Login
Attempts to log in with a wrong password to verify the error response.
```bash
curl.exe -X POST http://localhost/foshol/public/api/login -H "Content-Type: application/json" -H "Accept: application/json" -d "{\"email\":\"terminal1@example.com\", \"password\":\"wrongpassword\"}"
```

### 4. Create a Land (Requires Token)
Replace `YOUR_TOKEN_HERE` with the token from Step 1 or 2. Note the `id` returned in the response for Step 6.
```bash
curl.exe -X POST http://localhost/foshol/public/api/lands -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Content-Type: application/json" -H "Accept: application/json" -d "{\"name\":\"Terminal Land\", \"area\":10, \"location\":\"Dhaka\", \"type\":\"Plain\"}"
```

### 5. Fetch User Lands (Requires Token)
```bash
curl.exe -X GET http://localhost/foshol/public/api/lands -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Accept: application/json"
```

### 6. Create a Crop (Requires Token)
Replace `YOUR_TOKEN_HERE` with your token. (If your land from Step 4 got ID 1, keep `"land_id":1`, otherwise update it). Note the `id` returned for Step 10.
```bash
curl.exe -X POST http://localhost/foshol/public/api/crops -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Content-Type: application/json" -H "Accept: application/json" -d "{\"name\":\"Terminal Rice\", \"type\":\"Rice\", \"start_date\":\"2024-01-01\", \"land_id\":1, \"phases\":[{\"name\":\"Seedling\", \"days_count\": 10}, {\"name\":\"Vegetative\", \"days_count\": 20}]}"
```

### 7. Fetch User Crops (Requires Token)
```bash
curl.exe -X GET http://localhost/foshol/public/api/crops -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Accept: application/json"
```

### 8. Disease Detection (Requires Token)
Sends a fake 1-pixel Base64 image to the disease detection endpoint.
```bash
curl.exe -X POST http://localhost/foshol/public/api/disease-detection -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Content-Type: application/json" -H "Accept: application/json" -d "{\"image\":\"data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=\", \"cropType\":\"Rice\"}"
```

### 9. Weather Summary (Requires Token)
```bash
curl.exe -X GET "http://localhost/foshol/public/api/weather?lat=23.8103&lon=90.4125" -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Accept: application/json"
```

### 10. Delete a Crop (Requires Token)
Replace `YOUR_TOKEN_HERE` with your token, and replace the `1` at the end of the URL with the Crop ID you received in Step 6.
```bash
curl.exe -X DELETE http://localhost/foshol/public/api/crops/1 -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Accept: application/json"
```
