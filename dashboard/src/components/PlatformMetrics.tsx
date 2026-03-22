import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_GOAL = 100000;

const PlatformMetrics = () => {
  const [ytVal, setYtVal] = useState<number>(0);
  const [igVal, setIgVal] = useState<number>(0);

  const [isEditingYt, setIsEditingYt] = useState(false);
  const [isEditingIg, setIsEditingIg] = useState(false);

  const [editYtInput, setEditYtInput] = useState('');
  const [editIgInput, setEditIgInput] = useState('');

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    const { data } = await supabase.from('platform_metrics').select('*').order('recorded_at', { ascending: false });
    if (data && data.length > 0) {
      const latestYt = data.find(m => m.platform === 'youtube');
      const latestIg = data.find(m => m.platform === 'instagram');
      
      if (latestYt) setYtVal(latestYt.subscriber_follower_count || 0);
      else setYtVal(15000); 

      if (latestIg) setIgVal(latestIg.subscriber_follower_count || 0);
      else setIgVal(15000); 
    }
  };

  const saveMetric = async (platform: string, count: number) => {
    try {
      const { error } = await supabase.from('platform_metrics').insert([{
        platform,
        subscriber_follower_count: count
      }]);
      if (error) throw error;
      toast.success(`${platform.toUpperCase()} metrics updated successfully!`);
    } catch(e: any) {
      toast.error('Failed to save metrics: ' + e.message);
    }
  };

  const handleSaveYt = async () => {
    const val = parseInt(editYtInput, 10);
    if (!isNaN(val)) {
      setYtVal(val);
      await saveMetric('youtube', val);
    }
    setIsEditingYt(false);
  };

  const handleSaveIg = async () => {
    const val = parseInt(editIgInput, 10);
    if (!isNaN(val)) {
      setIgVal(val);
      await saveMetric('instagram', val);
    }
    setIsEditingIg(false);
  };

  return (
    <div style={{ padding: '32px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Performance</h2>
      <p style={{ color: '#a1a1aa', marginTop: '8px', fontSize: '14px' }}>Social growth matrix and trajectory.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '40px' }}>
        
        {/* YOUTUBE CARD */}
        <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '24px', padding: '32px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '1px', color: '#a1a1aa', fontWeight: 600 }}>YOUTUBE</div>
              <div style={{ fontSize: '12px', color: '#a3e635', marginTop: '4px', fontFamily: 'monospace' }}>CHANNEL_ID_8X92</div>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
              +12% LAST 30D
            </div>
          </div>
          
          <div style={{ marginTop: '48px', display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            {isEditingYt ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input 
                  type="number" 
                  autoFocus
                  defaultValue={ytVal}
                  onChange={e => setEditYtInput(e.target.value)} 
                  style={{ fontSize: '48px', fontWeight: 700, background: 'transparent', border: 'none', borderBottom: '2px solid #ef4444', color: 'white', width: '220px', outline: 'none' }} 
                />
                <button onClick={handleSaveYt} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
                <button onClick={() => setIsEditingYt(false)} style={{ padding: '8px 16px', background: 'transparent', color: '#a1a1aa', border: 'none', cursor: 'pointer' }}>Cancel</button>
              </div>
            ) : (
              <>
                <span 
                  style={{ fontSize: '64px', fontWeight: 700, color: 'white', cursor: 'pointer', letterSpacing: '-1px' }} 
                  onClick={() => { setEditYtInput(ytVal.toString()); setIsEditingYt(true); }} 
                  title="Click to edit metrics manually"
                >
                  {ytVal.toLocaleString()}
                </span>
                <span style={{ fontSize: '18px', color: '#71717a', fontWeight: 500 }}>/ {TARGET_GOAL.toLocaleString()}</span>
              </>
            )}
          </div>

          <div style={{ marginTop: '48px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#71717a', marginBottom: '8px', letterSpacing: '1px', fontWeight: 600 }}>
              <span>PROGRESS</span>
              <span>{Math.min((ytVal / TARGET_GOAL) * 100, 100).toFixed(1)}%</span>
            </div>
            <div style={{ height: '4px', background: '#27272a', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min((ytVal / TARGET_GOAL) * 100, 100)}%`, background: '#ef4444' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#71717a', marginTop: '8px', letterSpacing: '1px', fontWeight: 600 }}>
              <span>START: 0</span>
              <span>TARGET: {(TARGET_GOAL/1000).toFixed(0)}K</span>
            </div>
          </div>
        </div>

        {/* INSTAGRAM CARD */}
        <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '24px', padding: '32px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '1px', color: '#a1a1aa', fontWeight: 600 }}>INSTAGRAM</div>
              <div style={{ fontSize: '12px', color: '#a3e635', marginTop: '4px', fontFamily: 'monospace' }}>@samirdoes.ai</div>
            </div>
            <div style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#d8b4fe', padding: '4px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
              +5% LAST 30D
            </div>
          </div>
          
          <div style={{ marginTop: '48px', display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            {isEditingIg ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input 
                  type="number" 
                  autoFocus
                  defaultValue={igVal}
                  onChange={e => setEditIgInput(e.target.value)} 
                  style={{ fontSize: '48px', fontWeight: 700, background: 'transparent', border: 'none', borderBottom: '2px solid #a855f7', color: 'white', width: '220px', outline: 'none' }} 
                />
                <button onClick={handleSaveIg} style={{ padding: '8px 16px', background: '#a855f7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
                <button onClick={() => setIsEditingIg(false)} style={{ padding: '8px 16px', background: 'transparent', color: '#a1a1aa', border: 'none', cursor: 'pointer' }}>Cancel</button>
              </div>
            ) : (
              <>
                <span 
                  style={{ fontSize: '64px', fontWeight: 700, color: 'white', cursor: 'pointer', letterSpacing: '-1px' }} 
                  onClick={() => { setEditIgInput(igVal.toString()); setIsEditingIg(true); }} 
                  title="Click to edit metrics manually"
                >
                  {igVal.toLocaleString()}
                </span>
                <span style={{ fontSize: '18px', color: '#71717a', fontWeight: 500 }}>/ {TARGET_GOAL.toLocaleString()}</span>
              </>
            )}
          </div>

          <div style={{ marginTop: '48px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#71717a', marginBottom: '8px', letterSpacing: '1px', fontWeight: 600 }}>
              <span>PROGRESS</span>
              <span>{Math.min((igVal / TARGET_GOAL) * 100, 100).toFixed(1)}%</span>
            </div>
            <div style={{ height: '4px', background: '#27272a', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min((igVal / TARGET_GOAL) * 100, 100)}%`, background: '#a855f7' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#71717a', marginTop: '8px', letterSpacing: '1px', fontWeight: 600 }}>
              <span>START: 0</span>
              <span>TARGET: {(TARGET_GOAL/1000).toFixed(0)}K</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PlatformMetrics;
