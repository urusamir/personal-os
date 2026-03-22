import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function scrapeSubreddit(subreddit: string): Promise<any[]> {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/top.json?limit=25&t=day`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'PersonalOS/1.0.0'
      }
    });

    const posts = response.data.data.children.map((child: any) => {
      const previewUrl = child.data.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&');
      const fallbackThumbnail = ['self', 'default', 'nsfw', 'spoiler', ''].includes(child.data.thumbnail) ? null : child.data.thumbnail;
      const finalImage = previewUrl || fallbackThumbnail;

      return {
        url: `https://www.reddit.com${child.data.permalink}`,
        title_hash: Buffer.from(child.data.title).toString('base64'),
        title: child.data.title,
        score: child.data.score,
        engagement_metrics: {
          comments_count: child.data.num_comments,
          upvote_ratio: child.data.upvote_ratio,
          subreddit: child.data.subreddit,
          thumbnail: finalImage
        },
        scraped_at: new Date().toISOString(),
        status: 'new'
      };
    });

    return posts;
  } catch (error) {
    console.error(`Error scraping r/${subreddit}:`, error);
    return [];
  }
}

async function runScraper() {
  console.log('Starting Reddit Scraper...');
  const n8nPosts = await scrapeSubreddit('n8n');
  
  const allPosts = [...n8nPosts];
  console.log(`Scraped ${allPosts.length} posts successfully.`);
  
  if (allPosts.length > 0) {
    // Clear old data seamlessly
    await supabase.from('trends_reddit').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const { error } = await supabase
      .from('trends_reddit')
      .upsert(allPosts, { onConflict: 'url' });
      
    if (error) {
       console.error('Error saving to Supabase:', error);
    } else {
       console.log('Successfully saved to Supabase trends_reddit table!');
    }
  }
}

runScraper();
