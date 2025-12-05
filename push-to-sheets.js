import "dotenv/config";
import fs from "fs";
import { google } from "googleapis";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Google Sheets configuration
// You'll need to set these values:
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE"; // Get this from the URL of your Google Sheet
const SHEET_NAME = "Gold Prices"; // Name of the sheet tab

async function extractLLM(text) {
    const prompt = `
Extract all numeric gold price values from this OCR dump.

Return ONLY valid JSON:

{
  "bochk_50g_buy": "",
  "bochk_50g_sell": "",
  "bochk_2g_buy": "",
  "bochk_2g_sell": "",
  "emperio_price": "",
  "emperio_buyback": "",
  "heraeus_price": ""
}
If a value is missing, put an empty string.
    `;

    const res = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: "You extract financial values with absolute precision." },
            { role: "user", content: prompt + "\n\nOCR TEXT:\n\n" + text }
        ],
        response_format: { type: "json_object" }
    });

    return JSON.parse(res.choices[0].message.content);
}

async function getAuthClient() {
    // Load credentials from the service account key file
    const credentials = JSON.parse(fs.readFileSync(process.env.GOOGLE_VISION_KEYFILE, "utf8"));
    
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });
    
    return await auth.getClient();
}

async function initSheet(sheets, spreadsheetId) {
    try {
        // Check if sheet exists
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId
        });
        
        const sheetExists = spreadsheet.data.sheets.some(
            sheet => sheet.properties.title === SHEET_NAME
        );
        
        if (!sheetExists) {
            // Create the sheet
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: SHEET_NAME
                            }
                        }
                    }]
                }
            });
            console.log(`✓ Created sheet: ${SHEET_NAME}`);
        }
        
        // Check if header exists
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${SHEET_NAME}!A1:H1`
        });
        
        if (!response.data.values || response.data.values.length === 0) {
            // Add header row
            const header = [
                "Date",
                "BOCHK 50g Buy",
                "BOCHK 50g Sell",
                "BOCHK 2g Buy",
                "BOCHK 2g Sell",
                "Emperio Price",
                "Emperio Buyback",
                "Heraeus Price"
            ];
            
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${SHEET_NAME}!A1:H1`,
                valueInputOption: "RAW",
                resource: {
                    values: [header]
                }
            });
            console.log("✓ Added header row");
        }
    } catch (error) {
        console.error("Error initializing sheet:", error.message);
        throw error;
    }
}

async function appendToSheet(sheets, spreadsheetId, data) {
    const row = [
        new Date().toISOString(),
        data.bochk_50g_buy || "",
        data.bochk_50g_sell || "",
        data.bochk_2g_buy || "",
        data.bochk_2g_sell || "",
        data.emperio_price || "",
        data.emperio_buyback || "",
        data.heraeus_price || ""
    ];
    
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_NAME}!A:H`,
        valueInputOption: "RAW",
        resource: {
            values: [row]
        }
    });
}

async function run() {
    try {
        // Authenticate with Google
        const authClient = await getAuthClient();
        const sheets = google.sheets({ version: "v4", auth: authClient });
        console.log("✓ Authenticated with Google Sheets");

        // Initialize sheet
        await initSheet(sheets, SPREADSHEET_ID);

        // Read OCR files
        const ocrFiles = fs.readdirSync("outputs/ocr").filter(f => f.endsWith(".txt"));
        let combinedOCR = "";

        for (const f of ocrFiles) {
            combinedOCR += fs.readFileSync("outputs/ocr/" + f, "utf8") + "\n\n";
        }

        // Extract data using LLM
        console.log("Extracting data with LLM...");
        const data = await extractLLM(combinedOCR);

        // Append to Google Sheet
        await appendToSheet(sheets, SPREADSHEET_ID, data);
        console.log("✓ Appended data to Google Sheet");
        console.log("Data:", data);
        console.log(`\nView your sheet: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`);

    } catch (error) {
        console.error("Error:", error.message);
        throw error;
    }
}

run();
