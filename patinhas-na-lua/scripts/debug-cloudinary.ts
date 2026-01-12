
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

// Manually load .env to avoid dependency
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = envContent.split('\n').reduce((acc: any, line) => {
const parts = line.split('=');
    if (parts.length >= 2) {
        let value = parts.slice(1).join('=').trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        acc[parts[0].trim()] = value;
    }
    return acc;
}, {});

console.log("Loading Cloudinary Config...");
console.log("Cloud Name:", envVars.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
// Mask secrets
console.log("API Key:", envVars.CLOUDINARY_API_KEY ? "***" : "MISSING");
console.log("API Secret:", envVars.CLOUDINARY_API_SECRET ? "***" : "MISSING");

cloudinary.config({
  cloud_name: envVars.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: envVars.CLOUDINARY_API_KEY,
  api_secret: envVars.CLOUDINARY_API_SECRET,
});

const TEST_FILE = "C:\\Users\\jonip\\.gemini\\antigravity\\brain\\08c1f77d-121d-406e-80ee-cb7ed11e1796\\uploaded_image_1768256987604.png";

async function testUpload() {
    console.log("Reading test file:", TEST_FILE);
    
    if (!fs.existsSync(TEST_FILE)) {
        console.error("Test file not found!");
        return;
    }

    const buffer = fs.readFileSync(TEST_FILE);
    console.log("File read. Size:", buffer.length);

    console.log("Attempting upload...");

    try {
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { 
                    folder: "patinhas-debug",
                    resource_type: "image"
                }, 
                (error, result) => {
                    if (error) {
                         console.error("Cloudinary Callback Error:", error);
                         reject(error);
                    }
                    else resolve(result);
                }
            ).end(buffer);
        });

        console.log("✅ Upload Successful!");
        console.log(result);
    } catch (error) {
        console.error("❌ Catch Error:", error);
    }
}

testUpload();
