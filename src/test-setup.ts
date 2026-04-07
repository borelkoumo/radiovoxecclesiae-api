// Set required env vars before any module is loaded in tests
process.env["NODE_ENV"] = "test";
process.env["PORT"] = "3001";
process.env["CORS_ORIGIN"] = "*";
process.env["FIREBASE_PROJECT_ID"] = "rve-test";
process.env["FIREBASE_CLIENT_EMAIL"] = "test@rve-test.iam.gserviceaccount.com";
process.env["FIREBASE_PRIVATE_KEY"] =
  "-----BEGIN RSA PRIVATE KEY-----\\ntest\\n-----END RSA PRIVATE KEY-----";
