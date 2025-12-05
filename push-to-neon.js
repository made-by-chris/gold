import "dotenv/config";
import fs from "fs";
import pg from "pg";
import OpenAI from "openai";

const { Client } = pg;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DATABASE_URL = process.env.DATABASE_URL;

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

async function initDatabase(dbClient) {
    // Create table if it doesn't exist
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS gold_prices (
            id SERIAL PRIMARY KEY,
            date TIMESTAMP NOT NULL,
            bochk_50g_buy TEXT,
            bochk_50g_sell TEXT,
            bochk_2g_buy TEXT,
            bochk_2g_sell TEXT,
            emperio_price TEXT,
            emperio_buyback TEXT,
            heraeus_price TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    await dbClient.query(createTableQuery);
    console.log("✓ Table 'gold_prices' ready");
}

async function insertData(dbClient, data) {
    const insertQuery = `
        INSERT INTO gold_prices (
            date,
            bochk_50g_buy,
            bochk_50g_sell,
            bochk_2g_buy,
            bochk_2g_sell,
            emperio_price,
            emperio_buyback,
            heraeus_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id;
    `;
    
    const values = [
        new Date(),
        data.bochk_50g_buy || null,
        data.bochk_50g_sell || null,
        data.bochk_2g_buy || null,
        data.bochk_2g_sell || null,
        data.emperio_price || null,
        data.emperio_buyback || null,
        data.heraeus_price || null
    ];
    
    const result = await dbClient.query(insertQuery, values);
    return result.rows[0].id;
}

async function run() {
    const dbClient = new Client({
        connectionString: DATABASE_URL
    });

    try {
        // Connect to database
        await dbClient.connect();
        console.log("✓ Connected to Neon Postgres");

        // Initialize table
        await initDatabase(dbClient);

        // Read OCR files
        const ocrFiles = fs.readdirSync("outputs/ocr").filter(f => f.endsWith(".txt"));
        let combinedOCR = "";

        for (const f of ocrFiles) {
            combinedOCR += fs.readFileSync("outputs/ocr/" + f, "utf8") + "\n\n";
        }

        // Extract data using LLM
        console.log("Extracting data with LLM...");
        const data = await extractLLM(combinedOCR);

        // Insert into database
        const insertedId = await insertData(dbClient, data);
        console.log(`✓ Inserted row with ID: ${insertedId}`);
        console.log("Data:", data);

    } catch (error) {
        console.error("Error:", error.message);
        throw error;
    } finally {
        await dbClient.end();
    }
}

run();
