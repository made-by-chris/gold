import { execSync } from "child_process";
import fs from "fs";

/**
 * Parent orchestrator script that runs the entire gold price scraping pipeline
 * 
 * Pipeline:
 * 1. scrape.js    - Screenshot gold price websites
 * 2. ocr.js       - Extract text from screenshots using OpenAI Vision
 * 3. extract.js   - Extract structured data using LLM and save to CSV
 * 4. push-to-neon.js - Insert data into Neon Postgres database
 */

function runScript(scriptName) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`▶ Running: ${scriptName}`);
    console.log("=".repeat(60));
    
    try {
        execSync(`node ${scriptName}`, { 
            stdio: "inherit",
            encoding: "utf-8"
        });
        console.log(`✓ ${scriptName} completed successfully\n`);
        return true;
    } catch (error) {
        console.error(`✗ ${scriptName} failed with error:`, error.message);
        return false;
    }
}

async function main() {
    console.log("\n🚀 Starting Gold Price Pipeline");
    console.log(`Started at: ${new Date().toISOString()}\n`);

    // Ensure output directories exist
    if (!fs.existsSync("outputs")) {
        fs.mkdirSync("outputs", { recursive: true });
    }

    const pipeline = [
        "scrape.js",
        "ocr.js",
        "extract.js",
        "push-to-neon.js"
    ];

    let allSuccess = true;

    for (const script of pipeline) {
        const success = runScript(script);
        if (!success) {
            allSuccess = false;
            console.error(`\n❌ Pipeline failed at: ${script}`);
            console.error("Stopping execution.");
            process.exit(1);
        }
    }

    if (allSuccess) {
        console.log("\n" + "=".repeat(60));
        console.log("✅ Pipeline completed successfully!");
        console.log(`Finished at: ${new Date().toISOString()}`);
        console.log("=".repeat(60) + "\n");
    }
}

main().catch(error => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
});
