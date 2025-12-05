# Gold Price Scraper

This tool automatically collects gold prices from websites every 6 hours and saves them to a database.

---

## What You Need

Before you start, you'll need two things:

### 1. OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Click on your profile (top right) → **API keys**
4. Click **Create new secret key**
5. Give it a name like "Gold Scraper"
6. Copy the key (it starts with `sk-proj-...`)
7. **Save it somewhere safe** - you can only see it once!

**Note:** You need to add a payment method to OpenAI. The scraper costs about $0.05 per run (roughly $6/month if it runs every 6 hours).

### 2. Neon Database

1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project
4. Click **Connection String** 
5. Copy the connection string (it starts with `postgresql://...`)

---

## Testing Locally First

Before setting up automation, test it on your computer to make sure everything works.

### Step 1: Get the Code

If you haven't already, download or fork this project to your computer.

### Step 2: Create a `.env` File

In the project folder, create a new file called `.env` (yes, it starts with a dot).

Put this inside:

```
OPENAI_API_KEY=your-openai-key-here
DATABASE_URL=your-neon-database-url-here
```

Replace `your-openai-key-here` and `your-neon-database-url-here` with the actual keys you got above.

**Example:**
```
OPENAI_API_KEY=sk-proj-abc123xyz...
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname
```

### Step 3: Install Dependencies

Open a terminal in the project folder and run:

```bash
npm install
```

This downloads all the tools the scraper needs.

### Step 4: Test It

Run the scraper:

```bash
node run-all.js
```

This will:
1. Take screenshots of gold price websites
2. Extract text from the images
3. Pull out the prices
4. Save them to your database

**It takes 2-5 minutes to complete.**

If you see "✅ Pipeline completed successfully!" at the end, you're good to go!

---

## Setting Up Automation (GitHub Actions)

Once it works locally, you can set it up to run automatically every 6 hours using GitHub.

### Step 1: Push to GitHub

If you haven't already:

1. Create a new repository on [GitHub](https://github.com)
2. Push your code to that repository

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

### Step 2: Add Your Keys to GitHub

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**

Add these two secrets:

**First Secret:**
- Name: `OPENAI_API_KEY`
- Value: (paste your OpenAI key)
- Click **Add secret**

**Second Secret:**
- Name: `DATABASE_URL`
- Value: (paste your Neon database URL)
- Click **Add secret**

### Step 3: Test the Automation

1. Click the **Actions** tab at the top
2. On the left, click **Gold Price Scraper**
3. Click **Run workflow** (top right)
4. Click the green **Run workflow** button

Watch it run! Click on the workflow to see live progress.

If it succeeds, you're all set! 🎉

---

## How It Works

Once set up, the scraper will **automatically run every 6 hours** without you doing anything.

You can check the runs by going to the **Actions** tab on GitHub.

### What Gets Scraped

The scraper collects gold prices from:
- Bank of China Hong Kong (BOCHK)
- Chow Tai Fook
- Emperio Gold Coins
- Heraeus

### Where the Data Goes

All prices are saved to your Neon database in a table called `gold_prices`.

You can view the data by connecting to your database or using the Neon dashboard.

---

## Changing the Schedule

By default, it runs every 6 hours. To change this:

1. Open `.github/workflows/gold-scraper.yml`
2. Find this line:
   ```yaml
   - cron: '0 */6 * * *'
   ```
3. Change it to:
   - Every 12 hours: `'0 */12 * * *'`
   - Every day at 9am: `'0 9 * * *'`
   - Every hour: `'0 * * * *'`

4. Save, commit, and push the change

---

## Troubleshooting

### "Module not found" error
- Make sure you ran `npm install`
- Check that `package.json` exists in your project

### "API key not found" error
- Make sure your `.env` file is in the project root (for local testing)
- Make sure you added the secrets in GitHub (for automation)

### "Connection refused" database error
- Check that your Neon database URL is correct
- Make sure your Neon database is active (not paused)

### GitHub Actions workflow doesn't appear
- Make sure `.github/workflows/gold-scraper.yml` exists in your repo
- Make sure you committed and pushed it to GitHub

---

## Cost

**OpenAI API:** ~$6/month (if running every 6 hours)

**Neon Database:** Free (up to 0.5GB storage)

**GitHub Actions:** Free (unlimited for public repos, 2,000 minutes/month for private repos)

**Total:** About $6/month

---

## Need Help?

If something isn't working, check the error messages carefully. Most issues are:
- Missing API keys
- Typos in the `.env` file or GitHub secrets
- Forgot to run `npm install`

Good luck! 🚀
