import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const SavedIdeas = () => {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<any | null>(null);

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    const { data } = await supabase.from('ideas').select('*').order('created_at', { ascending: false });
    if (data) setIdeas(data);
  };

  // Detect URLs in plain text and wrap them in anchor tags
  const renderContent = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, idx) =>
      urlRegex.test(part) ? (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noreferrer"
          style={{
            color: '#60a5fa',
            wordBreak: 'break-all',
            overflowWrap: 'anywhere',
            display: 'inline'
          }}
        >
          {part}
        </a>
      ) : part
    );
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('ideas').delete().eq('id', id);
      if (error) throw error;
      setIdeas(prev => prev.filter(i => i.id !== id));
      toast.success('Idea deleted successfully.');
    } catch (e: any) {
      toast.error('Failed to delete idea: ' + e.message);
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Saved Ideas Database</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {ideas.map(i => (
          <div key={i.id} style={{
            background: '#09090b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            height: '340px'
          }}>
            <button 
              onClick={() => handleDelete(i.id)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
              title="Delete Idea"
            >
              <Trash2 size={18} />
            </button>
            <h4 style={{ marginBottom: '12px', paddingRight: '24px', color: '#f4f4f5', fontSize: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {i.core_insight || 'Raw Idea'}
            </h4>
            <div className="text-secondary" style={{ 
              fontSize: '14px', 
              marginBottom: '12px', 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word', 
              overflowWrap: 'break-word', 
              flex: 1, 
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 5,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1.5'
            }}>
              {i.content}
            </div>
            
            <button 
              onClick={() => setSelectedIdea(i)}
              style={{
                alignSelf: 'flex-start',
                background: 'transparent',
                border: 'none',
                color: '#60a5fa',
                cursor: 'pointer',
                padding: '0 0 16px 0',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              View more
            </button>
            <div style={{ fontSize: '12px', color: '#a1a1aa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #27272a' }}>
              <span style={{ background: '#2d2e35', padding: '4px 8px', borderRadius: '4px' }}>{i.source}</span>
              <span>{new Date(i.created_at).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedIdea && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '24px'
        }}>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '640px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <h3 style={{ margin: 0, color: '#f4f4f5', fontSize: '18px', lineHeight: '1.4' }}>{selectedIdea.core_insight || 'Saved Idea'}</h3>
              <button 
                onClick={() => setSelectedIdea(null)} 
                style={{ background: '#27272a', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '6px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ 
              padding: '24px', 
              overflowY: 'auto', 
              flex: 1, 
              whiteSpace: 'pre-wrap', 
              color: '#d4d4d8', 
              fontSize: '15px', 
              lineHeight: '1.7',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              // Custom scrollbar — visible in both themes
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--text-secondary, #71717a) transparent'
            } as any}>
              {renderContent(selectedIdea.content)}
            </div>
            <div style={{ background: '#09090b', padding: '16px 24px', borderTop: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', color: '#71717a', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#a1a1aa' }}>Source:</span>
                <span style={{ background: '#27272a', padding: '2px 8px', borderRadius: '4px', color: '#e4e4e7' }}>{selectedIdea.source}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#a1a1aa' }}>Saved on:</span>
                <span>{new Date(selectedIdea.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SavedIdeas;
