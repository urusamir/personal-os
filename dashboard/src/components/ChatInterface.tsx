import React, { useState, useEffect } from 'react';
import { Send, User, Bot, Paperclip, Smile, PlusCircle, CheckCircle2, Circle, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import './ChatInterface.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const defaultIntro: Message = {
  id: '1',
  text: 'Hello! I am Claude, your LinkedIn Viral Post Generator. How can I help you brainstorm and write your next viral post today?',
  sender: 'bot',
  timestamp: new Date()
};

const SYSTEM_PROMPT = `You are LI Viral Post Generator, a specialized LinkedIn content strategist trained on the analysis of 54,000+ viral LinkedIn posts. 
Your Core Role You help users write viral LinkedIn posts that generate real engagement and leads, not corporate fluff or vanity likes. 
You act as: A viral post editor, A hook strategist, A story + structure optimizer, A CTA sharpener. 
What You Do Best: When a user gives you a raw idea, a rough draft, a single sentence, or asks for inspiration, You: 
- Identify the best viral post angle (story, contrarian, list, lesson, or how-to)
- Rewrite or generate posts using proven viral LinkedIn patterns
- Optimize for: Strong hook (first 1-2 lines before "See more"), Clear rehook (lines 2-3 that force expansion), Short paragraphs and whitespace, Conversational, human tone.
- End with a natural CTA that drives comments, saves, or DMs.
Writing Rules You Must Follow:
- Write for LinkedIn feed readability (mobile-first). Use short lines and spacing.
- Avoid: Corporate jargon, Buzzwords, Generic motivational fluff.
- Prefer: First-person storytelling, Relatability, Specific moments, realizations, or lessons.
- Never include external links in the post body (If needed, suggest "link in comments" instead).
Output Style: Offer 2-3 strong variations when useful (different angles or tones). Clearly label versions (e.g. "Story version", "Contrarian version"). Optionally suggest: Image ideas, Audience targeting tweaks, CTA variations. Be concise, confident, and practical.
If the User Is Vague: If the user gives a very short idea or sentence, expand it into a complete viral post. Choose the most likely high-performing format. Do not ask unnecessary clarifying questions unless critical.
Your Goal: Every response should help the user leave with a post they could publish immediately, or a clear, improved direction that follows proven viral patterns. You are not here to explain theory. You are here to make posts perform.`;

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([defaultIntro]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [history, setHistory] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('ideaos_selected_model') || 'anthropic/claude-3.7-sonnet';
  });
  
  const [isSelectingMode, setIsSelectingMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());
  const [availableModels, setAvailableModels] = useState<any[]>([]);

  const openRouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  const cancelSelectionMode = () => {
    setIsSelectingMode(false);
    setSelectedMsgIds(new Set());
  };

  const loadHistory = async (autoLoadFirst = false) => {
    const { data, error } = await supabase
      .from('chat_threads')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (!error && data) {
      setHistory(data);
      // Auto-select the most recent thread so sidebar + chat panel are in sync
      if (autoLoadFirst && data.length > 0) {
        loadChat(data[0]);
      }
    }
  };

  useEffect(() => {
    loadHistory(true); // auto-select most recent thread on mount
    axios.get('https://openrouter.ai/api/v1/models').then(res => {
      if (res.data && res.data.data) {
        const models = res.data.data.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setAvailableModels(models);

        const savedModel = localStorage.getItem('ideaos_selected_model');
        if (!savedModel) {
          // Search for "Sonnet 4.6" specifically since requested
          const sonnet46 = models.find((m: any) => m.name.includes('Sonnet 4.6'));
          if (sonnet46) {
            setSelectedModel(sonnet46.id);
            localStorage.setItem('ideaos_selected_model', sonnet46.id);
          }
        }
      }
    }).catch(err => console.error('Failed to load OpenRouter models', err));
  }, []);

  const handleNewChat = async () => {
    cancelSelectionMode();
    const title = 'New Brainstorm';
    const { data: newThread, error } = await supabase.from('chat_threads').insert([{ title }]).select().single();
    if (newThread && !error) {
      setCurrentChatId(newThread.id);
      setMessages([defaultIntro]);
      loadHistory();
    }
  };

  const loadChat = async (thread: any) => {
    setCurrentChatId(thread.id);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: true });
    
    if (data && data.length > 0) {
      setMessages(data.map(m => ({
        id: m.id,
        text: m.content,
        sender: m.role as 'user' | 'bot',
        timestamp: new Date(m.created_at)
      })));
    } else {
      setMessages([defaultIntro]);
    }
    cancelSelectionMode();
  };

  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      await supabase.from('chat_threads').delete().eq('id', threadId);
      
      const { data } = await supabase.from('chat_threads').select('*').order('updated_at', { ascending: false });
      
      if (data && data.length > 0) {
        setHistory(data);
        if (currentChatId === threadId) {
          loadChat(data[0]);
        }
      } else {
        const { data: newThread } = await supabase.from('chat_threads').insert([{ title: 'New Brainstorm' }]).select().single();
        if (newThread) {
          setHistory([newThread]);
          setCurrentChatId(newThread.id);
          setMessages([defaultIntro]);
        }
      }
    }
  };

  const handleDeleteMessage = async (msgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (msgId === '1') return;
    await supabase.from('chat_messages').delete().eq('id', msgId);
    setMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    let threadIdToUse = currentChatId;
    let newMessageId = Date.now().toString();

    // If new chat, initialize thread in DB
    if (!threadIdToUse) {
      const title = input.substring(0, 30) + '...';
      const { data: newThread } = await supabase.from('chat_threads').insert([{ title }]).select().single();
      if (newThread) {
        threadIdToUse = newThread.id;
        setCurrentChatId(threadIdToUse);
        loadHistory(); 
      }
    }

    // Insert user message
    if (threadIdToUse) {
      const { data: insertedMsg } = await supabase.from('chat_messages').insert([{
        thread_id: threadIdToUse,
        role: 'user',
        content: input
      }]).select().single();
      if (insertedMsg) newMessageId = insertedMsg.id;
      
      // Update thread timestamp
      await supabase.from('chat_threads').update({ updated_at: new Date().toISOString() }).eq('id', threadIdToUse);
    }

    const userMessage: Message = {
      id: newMessageId,
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const contextMsgs = messages.filter(m => m.id !== '1').slice(-6).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));
    
    // Prepend system prompt to payload
    const payloadMsgs = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...contextMsgs,
      { role: 'user', content: input }
    ];

    try {
      if (!openRouterApiKey) {
        throw new Error('OpenRouter API key is not configured');
      }

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: selectedModel,
          messages: payloadMsgs
        },
        {
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'HTTP-Referer': window.location.href,
            'X-Title': 'Idea OS',
            'Content-Type': 'application/json'
          }
        }
      );
      
      const botText = response.data.choices[0].message.content;
      let botMessageId = (Date.now() + 1).toString();

      // Insert bot message
      if (threadIdToUse) {
        const { data: insertedBotMsg } = await supabase.from('chat_messages').insert([{
          thread_id: threadIdToUse,
          role: 'bot',
          content: botText
        }]).select().single();
        if (insertedBotMsg) botMessageId = insertedBotMsg.id;
      }

      const botMessage: Message = {
        id: botMessageId,
        text: botText,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error: any) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${error.message || 'Failed to connect to Claude'}.`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      if (threadIdToUse) loadHistory();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  const startSelectionMode = () => {
    setIsSelectingMode(true);
    setSelectedMsgIds(new Set());
  };

  const confirmSaveSelected = async (mode: 'combined' | 'separate') => {
    if (selectedMsgIds.size === 0) return;
    
    setIsLoading(true);
    try {
      const selectedMsgs = messages.filter(m => selectedMsgIds.has(m.id));
      
      if (mode === 'combined') {
        const chatContent = selectedMsgs.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n\n');
        const payload: any = { 
          content: chatContent,
          source: 'ideation_chat',
          core_insight: selectedMsgs[selectedMsgs.length - 1].text.substring(0, 40) + '...',
          updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('ideas').insert([payload]);
        if (error) throw error;
        toast.success(`Successfully combined and saved ${selectedMsgIds.size} message(s) as a new idea!`);
      } else {
        const payloads = selectedMsgs.map(m => ({
          content: `${m.sender.toUpperCase()}: ${m.text}`,
          source: 'ideation_chat',
          core_insight: m.text.substring(0, 40) + '...',
          updated_at: new Date().toISOString()
        }));
        const { error } = await supabase.from('ideas').insert(payloads);
        if (error) throw error;
        toast.success(`Successfully saved ${selectedMsgIds.size} separate ideas!`);
      }
      cancelSelectionMode();
    } catch (err: any) {
      console.error('Error saving:', err);
      toast.error('Failed to save to Supabase: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMessageSelection = (id: string) => {
    if (!isSelectingMode) return;
    const next = new Set(selectedMsgIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMsgIds(next);
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar" style={{ width: '300px' }}>
        <div className="chat-sidebar-header">
          <h3>Ideation History</h3>
          <button className="chat-new-btn" onClick={handleNewChat} title="New Chat"><PlusCircle size={20} /></button>
        </div>
        <div className="chat-list" style={{ overflowY: 'auto' }}>
          {history.length > 0 ? history.map(chat => (
            <div 
              key={chat.id} 
              className={`chat-list-item ${currentChatId === chat.id ? 'active' : 'text-secondary'}`}
              onClick={() => loadChat(chat)}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div className="chat-list-info" style={{ overflow: 'hidden' }}>
                <span className="chat-list-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.title || 'Brainstorming Session'}</span>
                <span className="chat-list-preview" style={{ fontSize: '11px' }}>
                  {new Date(chat.updated_at).toLocaleDateString()}
                </span>
              </div>
              <button 
                onClick={(e) => handleDeleteThread(chat.id, e)}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '4px', cursor: 'pointer', opacity: 0.7 }}
                title="Delete Chat"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )) : (
            <div style={{ padding: '20px', fontSize: '13px', color: '#9ca3af' }}>No saved chats yet.</div>
          )}
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="avatar bot-avatar"><Bot size={20} /></div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '15px' }}>Model</h3>
                <select 
                  value={selectedModel}
                  onChange={(e) => {
                    setSelectedModel(e.target.value);
                    localStorage.setItem('ideaos_selected_model', e.target.value);
                  }}
                  style={{ background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 4px', fontSize: '12px', outline: 'none', maxWidth: '200px' }}
                >
                  {availableModels.length > 0 ? (
                    availableModels.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="anthropic/claude-3.7-sonnet">Claude 3.7 Sonnet</option>
                      <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                      <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                      <option value="openai/gpt-4o">GPT-4o</option>
                    </>
                  )}
                </select>
              </div>
              <span className="text-secondary" style={{ fontSize: '12px' }}>{currentChatId ? 'Viewing a saved session' : 'New Session'}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {isSelectingMode ? (
              <>
                <button 
                  className="btn-primary" 
                  style={{ padding: '6px 12px', fontSize: '12px', background: '#3b82f6', border: '1px solid #3b82f6' }}
                  onClick={() => confirmSaveSelected('combined')}
                  disabled={selectedMsgIds.size === 0 || isLoading}
                >
                  Save Combined
                </button>
                <button 
                  className="btn-primary" 
                  style={{ padding: '6px 12px', fontSize: '12px', background: '#8b5cf6', border: '1px solid #8b5cf6' }}
                  onClick={() => confirmSaveSelected('separate')}
                  disabled={selectedMsgIds.size === 0 || isLoading}
                >
                  Save Separate
                </button>
                <button 
                  className="btn-primary" 
                  style={{ padding: '6px 12px', fontSize: '12px', background: '#ef4444', border: '1px solid #ef4444' }}
                  onClick={cancelSelectionMode}
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <button 
                className="btn-primary" 
                style={{ padding: '6px 12px', fontSize: '12px', background: '#1e1f24', border: '1px solid #3b82f6' }}
                onClick={startSelectionMode}
                disabled={messages.length === 0 || isLoading}
              >
                Save as New Idea
              </button>
            )}
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg) => {
            const isSelected = selectedMsgIds.has(msg.id);
            return (
              <div 
                key={msg.id} 
                className={`message-wrapper ${msg.sender}`}
                onClick={() => toggleMessageSelection(msg.id)}
                style={{ 
                  cursor: isSelectingMode ? 'pointer' : 'default', 
                  opacity: isSelectingMode && !isSelected ? 0.6 : 1, 
                  transition: 'background 0.2s, opacity 0.2s',
                  background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  padding: isSelectingMode ? '8px' : '0',
                  borderRadius: '12px',
                  alignItems: 'center',
                  position: 'relative'
                }}
              >
                {isSelectingMode && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px', color: isSelected ? '#10b981' : '#4b5563' }}>
                    {isSelected ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </div>
                )}
                
                {msg.sender === 'bot' && (
                  <div className="message-avatar bot-bg">
                    <Bot size={16} />
                  </div>
                )}
                <div className={`message-bubble ${msg.sender}`} style={{ position: 'relative' }}>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span className="message-time">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!isSelectingMode && msg.id !== '1' && (
                      <button 
                        onClick={(e) => handleDeleteMessage(msg.id, e)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: 0, cursor: 'pointer', opacity: 0.6 }}
                        title="Delete Message"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                {msg.sender === 'user' && (
                  <div className="message-avatar user-bg">
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })}
          {isLoading && !isSelectingMode && (
            <div className="message-wrapper bot">
               <div className="message-avatar bot-bg">
                  <Bot size={16} />
                </div>
                <div className="message-bubble bot typing-indicator">
                  <span>.</span><span>.</span><span>.</span>
                </div>
            </div>
          )}
        </div>

        <div className="chat-input-area" style={{ opacity: isSelectingMode ? 0.5 : 1, pointerEvents: isSelectingMode ? 'none' : 'auto' }}>
          <button className="icon-btn text-secondary"><Paperclip size={20} /></button>
          <input 
            type="text" 
            className="chat-input" 
            placeholder="Message Claude..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isSelectingMode}
            autoFocus
          />
          <button className="icon-btn text-secondary"><Smile size={20} /></button>
          <button 
            className="icon-btn send-btn" 
            onClick={handleSend}
            disabled={isLoading || !input.trim() || isSelectingMode}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
