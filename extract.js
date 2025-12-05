import "dotenv/config";
import fs from "fs";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

async function run() {
    const ocrFiles = fs.readdirSync("outputs/ocr").filter(f => f.endsWith(".txt"));

    let combinedOCR = "";

    for (const f of ocrFiles) {
        combinedOCR += fs.readFileSync("outputs/ocr/" + f, "utf8") + "\n\n";
    }

    const data = await extractLLM(combinedOCR);

    const file = "outputs/gold.csv";
    const header = Object.keys(data).join(",");

    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, "date," + header + "\n");
    }

    const row = [
        new Date().toISOString(),
        ...Object.values(data)
    ].join(",");

    fs.appendFileSync(file, row + "\n");

    console.log("Wrote → outputs/gold.csv");
}

run();
