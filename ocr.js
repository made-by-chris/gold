import "dotenv/config";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const screenshotsDir = "outputs/screenshots";
const ocrDir = "outputs/ocr";

if (!fs.existsSync(ocrDir)) fs.mkdirSync(ocrDir, { recursive: true });

async function ocrOpenAI(imagePath) {
    // Read the image file and convert to base64
    const imgBuffer = fs.readFileSync(imagePath);
    const base64Image = imgBuffer.toString('base64');
    
    // Determine the image type from the file extension
    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.gif': 'image/gif'
    };
    const mimeType = mimeTypes[ext] || 'image/png';
    
    // Use the Chat Completions API with vision capability
    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "Extract all text from this image. Return only the extracted text without any additional commentary."
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:${mimeType};base64,${base64Image}`
                        }
                    }
                ]
            }
        ],
        max_tokens: 1000
    });

    return response.choices[0].message.content.trim();
}


async function run() {
    const screenshotFiles = fs
        .readdirSync(screenshotsDir)
        .filter(f => f.endsWith(".png"));

    for (const file of screenshotFiles) {
        const fullPath = path.join(screenshotsDir, file);
        const outFile = path.join(ocrDir, file.replace(".png", ".txt"));

        console.log("OCR:", fullPath);

        try {
            const text = await ocrOpenAI(fullPath);
            fs.writeFileSync(outFile, text, "utf8");
            console.log("✓", outFile);
        } catch (err) {
            console.error("OCR FAILED:", file, "\n", err.message);
        }
    }
}

run();
