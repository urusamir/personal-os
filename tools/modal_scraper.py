import modal
import subprocess
import os

# We define a Modal Image that has Node.js and TypeScript installed
# so it can run our existing TS scraper directly.
image = (
    modal.Image.debian_slim()
    .apt_install("curl")
    .run_commands(
        "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -",
        "apt-get install -y nodejs",
        "npm install -g tsx typescript"
    )
    .pip_install("python-dotenv")
)

app = modal.App("blast-master-scraper")

# Create a scheduled function that runs every 24 hours at midnight UTC
@app.function(
    image=image,
    schedule=modal.Cron("0 0 * * *"),
    secrets=[
        modal.Secret.from_name("supabase-credentials"), # Make sure you upload VITE_SUPABASE_URL and ANON_KEY via the Modal Dashboard
        modal.Secret.from_name("reddit-credentials")
    ]
)
def run_daily_scrapers():
    """
    This function acts as a wrapper to execute our robust TypeScript scraper
    inside the Modal serverless environment daily.
    """
    print("Starting daily IDEAS OS scraping job via Modal...")
    
    # Execute the social metrics scraper
    result = subprocess.run(
        ["tsx", "tools/social_metrics.ts"], 
        capture_output=True, 
        text=True
    )
    
    print("Scraper Output:", result.stdout)
    
    if result.stderr:
        print("Scraper Errors:", result.stderr)

# To deploy this CRON job, simply run:
# modal deploy tools/modal_scraper.py
