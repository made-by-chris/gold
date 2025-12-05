import puppeteer from "puppeteer";
import fs from "fs";

const targets = [
    {
        name: "ctf",
        url: "https://www.chowtaifook.com/zh-hk/eshop/realtime-gold-price.html/?tab=goldPellet"
    },
    {
        name: "bochk",
        url: "https://www.bochk.com/en/investment/rates/metal.html"
    },
    {
        name: "emperio",
        url: "https://emperiogoldcoins.com/zh_HK/%E9%BB%83%E9%87%91%E7%94%A2%E5%93%81/%E9%BB%83%E9%87%91%E7%8F%BE%E5%83%B9%E5%B9%A3/%E8%B3%80%E5%88%A9%E6%B0%8F-99-99-%E6%A8%A1%E9%91%84%E9%87%91%E6%A2%9D-1%E5%85%AC%E6%96%A4-%E9%99%84%E8%B3%80%E5%88%A9%E6%B0%8F%E8%AD%89%E6%9B%B8"
    },
    {
        name: "heraeus",
        url: "https://www.heraeus-gold.hk/1kg-gold-cast-bar-999.9"
    }
];


async function run() {
    if (!fs.existsSync("outputs/screenshots"))
        fs.mkdirSync("outputs/screenshots", { recursive: true });

    const browser = await puppeteer.launch({
        headless: true,  
        defaultViewport: null
    });

    const page = await browser.newPage();

    for (const t of targets) {
        console.log(`Opening ${t.url}`);

        await page.goto(t.url, { waitUntil: "networkidle2" });

        await new Promise(r => setTimeout(r, 5000)); // Let everything render

        const file = `outputs/screenshots/${t.name}.png`;
        await page.screenshot({ path: file, fullPage: true });

        console.log("Saved:", file);
    }

    await browser.close();
}

run();
