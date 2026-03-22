import React, { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Bookmark, ExternalLink, Heart, MessageSquare, RefreshCw, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const PAGE_SIZE = 10;
const DAILY_LIMIT = 100;

const TrendingReddit = () => {
  const [allTrends, setAllTrends] = useState<any[]>([]);
  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const selectedDateRef = useRef<string>('');
  // Mirror of displayedCount readable inside async handlers without stale closure
  const displayedCountRef = useRef(PAGE_SIZE);
  useEffect(() => { displayedCountRef.current = displayedCount; }, [displayedCount]);


  useEffect(() => {
    initialLoad();
  }, []);

  const initialLoad = async () => {
    setLastRefreshed(new Date().toLocaleTimeString());
    const { data } = await supabase
      .from('trends_reddit')
      .select('*')
      .order('scraped_at', { ascending: false })
      .order('score', { ascending: false });

    if (data && data.length > 0) {
      setAllTrends(data);
      const dates = Array.from(
        new Set(data.filter(t => t.scraped_at).map(t => new Date(t.scraped_at).toLocaleDateString()))
      ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      setAvailableDates(dates);
      const today = dates[0];
      setSelectedDate(today);
      selectedDateRef.current = today;
      setDisplayedCount(PAGE_SIZE);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    selectedDateRef.current = date;
    setDisplayedCount(PAGE_SIZE);
  };

  // Sync = 1) trigger live Reddit scrape via Edge Function, 2) re-fetch DB, 3) reveal +10
  const handleSync = async () => {
    setIsSyncing(true);
    setLastRefreshed(new Date().toLocaleTimeString());

    // ── Step 1: Trigger the scraper Edge Function ──
    const scrapeToast = toast.loading('🔍 Scraping Reddit for fresh ideas…');
    try {
      const edgeFnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-reddit`;
      const res = await fetch(edgeFnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        }
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`✅ Scraped ${result.scraped} fresh posts from ${result.subreddits.join(', ')}`, {
          id: scrapeToast, duration: 4000
        });
      } else {
        toast.error('Scrape had issues: ' + (result.error || 'unknown'), { id: scrapeToast });
      }
    } catch (err: any) {
      toast.error('Scraper call failed: ' + err.message, { id: scrapeToast, duration: 4000 });
    }

    // ── Step 2: Re-fetch all DB data (now includes freshly scraped posts) ──
    const { data } = await supabase
      .from('trends_reddit')
      .select('*')
      .order('scraped_at', { ascending: false })
      .order('score', { ascending: false });

    const freshData = data && data.length > 0 ? data : allTrends;
    if (data && data.length > 0) setAllTrends(data);

    // Sort newest scraped first within the selected date
    const filtered = freshData
      .filter(t => t.scraped_at && new Date(t.scraped_at).toLocaleDateString() === selectedDateRef.current)
      .sort((a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime());

    const capped = Math.min(filtered.length, DAILY_LIMIT);
    const currentCount = displayedCountRef.current;

    // ── Step 3: Paginate +10 ──
    if (currentCount >= DAILY_LIMIT) {
      toast('📋 You\'ve reached today\'s 100-idea limit! Come back tomorrow.', {
        duration: 5000,
        style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #3b82f6' }
      });
    } else if (currentCount >= capped) {
      toast('📭 All available ideas are showing — new ones just scraped will appear now!', {
        duration: 3500,
        style: { background: '#1e293b', color: '#e2e8f0' }
      });
      // Reset to show freshly scraped items at top
      setDisplayedCount(Math.min(PAGE_SIZE, capped));
    } else {
      const next = Math.min(currentCount + PAGE_SIZE, capped);
      setDisplayedCount(next);
      if (next >= DAILY_LIMIT) {
        toast('🎉 100 ideas reached for today! Come back tomorrow for more.', {
          duration: 5000,
          style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #3b82f6' }
        });
      } else {
        toast.success(`+${next - currentCount} ideas loaded (${next} of ${capped} available)`);
      }
    }

    setIsSyncing(false);
  };

  // Sort newest first within the date, cap at daily limit
  const getFilteredForDate = () => {
    return allTrends
      .filter(t => t.scraped_at && new Date(t.scraped_at).toLocaleDateString() === selectedDate)
      .sort((a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime())
      .slice(0, Math.min(displayedCount, DAILY_LIMIT));
  };

  const handleSaveToIdeas = async (trend: any) => {
    if (savedIds.has(trend.id)) return;
    try {
      const { error } = await supabase.from('ideas').insert([
        {
          content: `Reddit Trend: ${trend.title}\nURL: ${trend.url}\nScore: ${trend.score}`,
          source: 'reddit_trend',
          source_url: trend.url,
          core_insight: trend.title.substring(0, 50) + '...'
        }
      ]);
      if (error) throw error;
      setSavedIds(prev => new Set(prev).add(trend.id));
      toast.success('Idea saved to your database!');
    } catch (err: any) {
      toast.error('Failed to save idea: ' + err.message);
    }
  };

  const displayedTrends = getFilteredForDate();
  const totalForDate = allTrends.filter(t => t.scraped_at && new Date(t.scraped_at).toLocaleDateString() === selectedDate).length;

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Discovery</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {availableDates.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px' }}>
              <CalendarDays size={16} style={{ color: 'var(--text-secondary)' }} />
              <select
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', padding: '10px', outline: 'none', cursor: 'pointer', fontSize: '14px' }}
              >
                {availableDates.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
          {lastRefreshed && <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Updated {lastRefreshed}</span>}
          <button
            className="btn-primary"
            onClick={handleSync}
            disabled={isSyncing}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#2d2e35', color: '#fff', border: 'none', borderRadius: '8px', cursor: isSyncing ? 'wait' : 'pointer', opacity: isSyncing ? 0.7 : 1 }}
          >
            <RefreshCw size={16} /> {isSyncing ? 'Syncing...' : 'Sync (+10)'}
          </button>
        </div>
      </div>

      {/* Pagination hint */}
      {displayedTrends.length > 0 && (
        <div style={{ marginBottom: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Showing <strong>{displayedTrends.length}</strong> of <strong>{Math.min(totalForDate, DAILY_LIMIT)}</strong> ideas for {selectedDate}
          {displayedCount < Math.min(totalForDate, DAILY_LIMIT) && (
            <span style={{ color: '#818cf8', marginLeft: '8px' }}>· Hit Sync to load {Math.min(PAGE_SIZE, Math.min(totalForDate, DAILY_LIMIT) - displayedCount)} more</span>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {displayedTrends.length === 0 ? (
          <p className="text-secondary">No trends available for this date. Run the scraper or select another day.</p>
        ) : displayedTrends.map(t => {
          const metrics = t.engagement_metrics || {};
          const rawThumb = metrics.thumbnail;
          // Filter out Reddit non-image placeholders
          const thumbnail = rawThumb &&
            rawThumb.startsWith('http') &&
            !rawThumb.includes('default') &&
            !rawThumb.includes('self') &&
            !rawThumb.includes('nsfw') &&
            !rawThumb.includes('spoiler') &&
            !rawThumb.includes('icon')
            ? rawThumb : null;

          const match = t.url ? t.url.match(/reddit\.com\/r\/([^/]+)/) : null;
          const fallbackSub = match ? match[1] : 'UNKNOWN';
          const subreddit = `R/${(metrics.subreddit || fallbackSub).toUpperCase()}`;
          const isSaved = savedIds.has(t.id);

          return (
            <div key={t.id} style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '280px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'default'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {thumbnail ? (
                <div style={{ height: '160px', width: '100%', overflow: 'hidden', background: '#1e1b4b' }}>
                  <img
                    src={thumbnail}
                    alt="thumbnail"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        e.currentTarget.style.display = 'none';
                        parent.style.background = 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)';
                        parent.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#a5b4fc;font-size:13px;font-weight:600;letter-spacing:1px">${subreddit}</div>`;
                      }
                    }}
                  />
                </div>
              ) : (
                // Clean gradient placeholder — honest no-image state
                <div style={{
                  height: '160px',
                  width: '100%',
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a5b4fc',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '1px'
                }}>
                  {subreddit}
                </div>
              )}

              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  {/* Indigo/violet — looks great in both light and dark mode */}
                  <span style={{ color: '#818cf8', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>
                    {subreddit}
                  </span>
                  <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)' }}>
                    <button
                      onClick={() => handleSaveToIdeas(t)}
                      style={{ background: 'none', border: 'none', color: isSaved ? '#818cf8' : 'inherit', cursor: 'pointer', padding: 0 }}
                      title="Save as Idea"
                    >
                      <Bookmark size={18} fill={isSaved ? '#818cf8' : 'none'} />
                    </button>
                    <a href={t.url} target="_blank" rel="noreferrer" style={{ color: 'inherit' }} title="Open in Reddit">
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>

                <h3 style={{ fontSize: '16px', lineHeight: '1.5', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 'auto', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {t.title}
                </h3>

                <div style={{ display: 'flex', gap: '16px', marginTop: '20px', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Heart size={14} /> <span>{t.score || 0}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquare size={14} /> <span>{metrics.comments_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrendingReddit;
