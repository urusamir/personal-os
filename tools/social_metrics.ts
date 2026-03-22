import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Fetches YouTube subscriber count by scraping the public channel URL
 * @param url YouTube Channel URL (e.g. https://www.youtube.com/@mkbhd)
 */
async function scrapeYoutubeSubscribers(url: string) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    const $ = cheerio.load(response.data);
    
    // YouTube often embeds stats in ytInitialData script
    const scriptText = $('script').filter((i, el) => {
      return $(el).html()?.includes('ytInitialData') || false;
    }).html();

    if (scriptText) {
      const match = scriptText.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"(.*?) subscribers"/);
      if (match && match[1]) {
        return match[1]; // E.g., "19.5M" or "1.2K"
      }
    }
    return "Scraping failed (Layout changed)";
  } catch (error) {
    console.error(`Error scraping YouTube (${url}):`, error);
    return null;
  }
}

/**
 * Note on Instagram Scraping:
 * Instagram aggressively blocks unauthenticated scraping.
 * We try to find the meta description tag which often holds follower counts.
 */
async function scrapeInstagramFollowers(url: string) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    const $ = cheerio.load(response.data);
    const metaDescription = $('meta[property="og:description"]').attr('content');
    
    if (metaDescription) {
      // Usually format is: "X Followers, Y Following, Z Posts - See Instagram photos..."
      const match = metaDescription.match(/([\d.,KMB]+)\s+Followers/i);
      if (match && match[1]) {
        return match[1];
      }
    }
    return "Scraping failed (Access blocked/Login required)";
  } catch (error: any) {
    if (error.response && error.response.status === 401 || error.response?.status === 429) {
      return "Scraping failed (Instagram blocked the request)";
    }
    console.error(`Error scraping Instagram (${url}):`, error);
    return null;
  }
}

async function runSocialMetrics() {
  console.log('--- Collecting Social Metrics via Scraping ---');
  
  const ytUrl = process.env.YOUTUBE_URL || 'https://www.youtube.com/@mkbhd';
  const igUrl = process.env.INSTAGRAM_URL || 'https://www.instagram.com/zuck';

  const ytSubs = await scrapeYoutubeSubscribers(ytUrl);
  if (ytSubs !== null) {
    console.log(`YouTube (${ytUrl}) Subscribers: ${ytSubs}`);
  }

  const igFollowers = await scrapeInstagramFollowers(igUrl);
  if (igFollowers !== null) {
    console.log(`Instagram (${igUrl}) Followers: ${igFollowers}`);
  }
}

runSocialMetrics();
