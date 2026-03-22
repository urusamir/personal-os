import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Youtube, Instagram } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const MainDashboard = () => {
  const [ytSubsRaw, setYtSubsRaw] = useState<number>(0);
  const [igFollowersRaw, setIgFollowersRaw] = useState<number>(0);
  const [recentIdeas, setRecentIdeas] = useState<any[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch platform metrics
      const { data: metrics } = await supabase
        .from('platform_metrics')
        .select('*');
      
      if (metrics && metrics.length > 0) {
        const yt = metrics.find(m => m.platform === 'youtube');
        const ig = metrics.find(m => m.platform === 'instagram');
        if (yt && yt.subscriber_follower_count) setYtSubsRaw(yt.subscriber_follower_count);
        if (ig && ig.subscriber_follower_count) setIgFollowersRaw(ig.subscriber_follower_count);
      }

      // Fetch ideas
      const { data: ideas } = await supabase
        .from('ideas')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(2);
      
      if (ideas) {
        setRecentIdeas(ideas);
      }
    };

    fetchData();
  }, []);
  const TARGET_GOAL = 100000;

  return (
    <div className="dashboard-content" style={{ position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {/* YOUTUBE CARD */}
        <div style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.6), rgba(239, 68, 68, 0.1))', padding: '1px', borderRadius: '24px', boxShadow: '0 12px 40px rgba(239, 68, 68, 0.15)' }}>
          <div style={{ background: 'var(--card-bg)', borderRadius: '23px', padding: '32px', position: 'relative', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ position: 'absolute', top: '32px', right: '32px', zIndex: 10, background: '#18181b', padding: '16px', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)' }}>
              <Youtube size={36} color="#ef4444" strokeWidth={2} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', zIndex: 10, position: 'relative' }}>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '6px' }}>YOUTUBE</div>
                <div style={{ color: '#bef264', fontSize: '12px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CHANNEL_ID_8X92</div>
              </div>
              <div style={{ paddingRight: '90px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#fca5a5', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', borderRadius: '16px', letterSpacing: '0.05em' }}>+12% LAST 30D</span>
              </div>
            </div>

            <div style={{ zIndex: 10, position: 'relative', marginBottom: '48px' }}>
              <span style={{ fontSize: '56px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>{ytSubsRaw.toLocaleString()}</span>
              <span style={{ fontSize: '20px', color: '#71717a', fontWeight: 600, marginLeft: '12px' }}>/ 100,000</span>
            </div>

            <div style={{ zIndex: 10, position: 'relative', marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#a1a1aa', marginBottom: '12px', fontWeight: 700, letterSpacing: '0.05em' }}>
                <span>PROGRESS</span>
                <span style={{ color: 'var(--text-primary)' }}>{Math.min((ytSubsRaw / TARGET_GOAL) * 100, 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ height: '100%', width: `${Math.min((ytSubsRaw / TARGET_GOAL) * 100, 100)}%`, background: 'linear-gradient(90deg, #b91c1c, #ef4444, #fca5a5)', borderRadius: '3px', boxShadow: '0 0 10px #ef4444' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#52525b', fontFamily: 'monospace', fontWeight: 500 }}>
                <span>START: 0</span>
                <span>TARGET: 100K</span>
              </div>
            </div>
          </div>
        </div>

        {/* INSTAGRAM CARD */}
        <div style={{ background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.6), rgba(244, 63, 94, 0.1))', padding: '1px', borderRadius: '24px', boxShadow: '0 12px 40px rgba(217, 70, 239, 0.15)' }}>
          <div style={{ background: 'var(--card-bg)', borderRadius: '23px', padding: '32px', position: 'relative', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ position: 'absolute', top: '32px', right: '32px', zIndex: 10, background: '#18181b', padding: '16px', borderRadius: '20px', border: '1px solid rgba(217, 70, 239, 0.3)', boxShadow: '0 8px 32px rgba(217, 70, 239, 0.2)' }}>
              <Instagram size={36} color="#d946ef" strokeWidth={2} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', zIndex: 10, position: 'relative' }}>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '6px' }}>INSTAGRAM</div>
                <div style={{ color: '#bef264', fontSize: '12px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>@HANDLE_229</div>
              </div>
              <div style={{ paddingRight: '90px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#f9a8d4', background: 'rgba(217, 70, 239, 0.15)', border: '1px solid rgba(217, 70, 239, 0.3)', padding: '6px 12px', borderRadius: '16px', letterSpacing: '0.05em' }}>+5% LAST 30D</span>
              </div>
            </div>

            <div style={{ zIndex: 10, position: 'relative', marginBottom: '48px' }}>
              <span style={{ fontSize: '56px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>{igFollowersRaw.toLocaleString()}</span>
              <span style={{ fontSize: '20px', color: '#71717a', fontWeight: 600, marginLeft: '12px' }}>/ 100,000</span>
            </div>

            <div style={{ zIndex: 10, position: 'relative', marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#a1a1aa', marginBottom: '12px', fontWeight: 700, letterSpacing: '0.05em' }}>
                <span>PROGRESS</span>
                <span style={{ color: 'var(--text-primary)' }}>{Math.min((igFollowersRaw / TARGET_GOAL) * 100, 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ height: '100%', width: `${Math.min((igFollowersRaw / TARGET_GOAL) * 100, 100)}%`, background: 'linear-gradient(90deg, #c026d3, #d946ef, #f472b6)', borderRadius: '3px', boxShadow: '0 0 10px #d946ef' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#52525b', fontFamily: 'monospace', fontWeight: 500 }}>
                <span>START: 0</span>
                <span>TARGET: 100K</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="list-section">
        <h3 style={{ marginBottom: '16px' }}>Recent Ideas</h3>
        <div className="card" style={{ padding: '0' }}>
          {recentIdeas.length > 0 ? recentIdeas.map(idea => (
            <div className="idea-row" key={idea.id}>
              <div className="idea-content">
                <div className="idea-title">{idea.content.substring(0, 50)}...</div>
                <div className="idea-meta">
                  <span className="badge" style={{ background: '#2d2e35', color: '#9ca3af' }}>{idea.source}</span>
                  <span>{new Date(idea.created_at).toLocaleString()}</span>
                </div>
              </div>
              <button 
                className="btn-primary" 
                style={{ padding: '8px 16px', fontSize: '13px', background: 'var(--border-color)', color: 'white', boxShadow: 'none' }}
                onClick={() => setSelectedIdea(idea)}
              >
                View
              </button>
            </div>
          )) : (
            <>
              <div className="idea-row">
                <div className="idea-content">
                  <div className="idea-title">Micro-SaaS for TikTok creators</div>
                  <div className="idea-meta">
                    <span className="badge" style={{ background: '#2d2e35', color: '#9ca3af' }}>ideation_chat</span>
                    <span>Today, 10:42 AM</span>
                  </div>
                </div>
                <button 
                  className="btn-primary" 
                  style={{ padding: '8px 16px', fontSize: '13px', background: 'var(--border-color)', color: 'white', boxShadow: 'none' }}
                >
                  View
                </button>
              </div>
              
              <div className="idea-row">
                <div className="idea-content">
                  <div className="idea-title">AI generated faceless reels guide</div>
                  <div className="idea-meta">
                    <span className="badge" style={{ background: '#2d2e35', color: '#9ca3af' }}>reddit_trend</span>
                    <span>Yesterday, 2:15 PM</span>
                  </div>
                </div>
                <button 
                  className="btn-primary" 
                  style={{ padding: '8px 16px', fontSize: '13px', background: 'var(--border-color)', color: 'white', boxShadow: 'none' }}
                >
                  View
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedIdea && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }} onClick={() => setSelectedIdea(null)}>
          <div className="card" style={{
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            position: 'relative',
            backgroundColor: '#1c1d21',
            border: '1px solid #3f3f46'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#f4f4f5', flex: 1, paddingRight: '20px' }}>{selectedIdea.core_insight || 'Idea Details'}</h3>
              <button 
                onClick={() => setSelectedIdea(null)}
                style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '20px', padding: '4px' }}
              >✕</button>
            </div>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: '#2d2e35', color: '#9ca3af' }}>{selectedIdea.source}</span>
              <span style={{ color: '#a1a1aa', fontSize: '13px', display: 'flex', alignItems: 'center' }}>{new Date(selectedIdea.created_at).toLocaleString()}</span>
            </div>
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              color: '#e4e4e7', 
              fontSize: '15px', 
              lineHeight: '1.6',
              background: '#121214',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #2d2e35',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}>
              {selectedIdea.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainDashboard;
