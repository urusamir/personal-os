import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const Header = () => {
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const [ideaText, setIdeaText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [profileName, setProfileName] = useState('Munaa');
  const [profileImage, setProfileImage] = useState('');
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState('');

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      // Fetch from Supabase as source of truth
      const { data } = await supabase.from('user_settings').select('*').eq('id', 1).single();
      if (data) {
        setProfileName(data.display_name || 'Commander');
        setProfileImage(data.avatar_url || '');
        localStorage.setItem('personalos_name', data.display_name || 'Commander');
        localStorage.setItem('personalos_image', data.avatar_url || '');
      } else {
        // Fallback to local storage if DB row doesn't exist yet
        const savedName = localStorage.getItem('personalos_name');
        const savedImage = localStorage.getItem('personalos_image');
        if (savedName) setProfileName(savedName);
        if (savedImage) setProfileImage(savedImage);
      }
    };
    loadProfile();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      if (data) {
        setEditImage(data.publicUrl);
      }
    } catch (error: any) {
      toast.error('Error uploading image: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuickCapture = async () => {
    if (!ideaText.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('ideas').insert([
        { content: ideaText, source: 'manual_quick_capture', core_insight: ideaText.substring(0, 50) }
      ]);
      if (error) throw error;
      toast.success('Idea captured successfully!');
      setShowModal(false);
      setIdeaText('');
    } catch (e: any) {
      toast.error('Error saving idea: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('user_settings').upsert({
        id: 1,
        display_name: editName || 'Commander',
        avatar_url: editImage || ''
      });
      if (error) throw error;

      localStorage.setItem('personalos_name', editName || 'Commander');
      localStorage.setItem('personalos_image', editImage || '');
      setProfileName(editName || 'Commander');
      setProfileImage(editImage || '');
      toast.success('Profile saved successfully!');
      setShowProfileModal(false);
    } catch (e: any) {
      toast.error('Error saving profile: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const openProfileModal = () => {
    setEditName(profileName);
    setEditImage(profileImage);
    setShowProfileModal(true);
  };

  return (
    <header className="header" style={{ position: 'relative' }}>
      <div className="header-title">
        <p className="text-secondary" style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Welcome back,</p>
        <h3>Commander</h3>
      </div>
      <div className="header-actions">
        <button className="btn-primary" onClick={() => setShowModal(!showModal)}>
          <span style={{ fontSize: '18px' }}>+</span> Quick Capture
        </button>
        <div 
          className="user-profile" 
          onClick={openProfileModal}
          style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <span className="avatar" style={{ 
            backgroundImage: profileImage ? `url(${profileImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: profileImage ? 'transparent' : '#8b5cf6'
          }}></span>
          <span style={{ fontWeight: 500, fontSize: '14px' }}>{profileName}</span>
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'absolute', top: '70px', right: '20px', background: '#1e1f24', 
          border: '1px solid #2d2e35', borderRadius: '12px', padding: '20px', 
          width: '300px', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
        }}>
          <h4 style={{ marginBottom: '12px' }}>Quick Capture</h4>
          <textarea 
            style={{ width: '100%', height: '100px', background: '#09090b', border: '1px solid #2d2e35', borderRadius: '8px', padding: '12px', color: 'white', marginBottom: '12px', resize: 'none' }}
            placeholder="Type your brilliant idea here..."
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button className="btn-primary" style={{ background: 'transparent', border: '1px solid #2d2e35' }} onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleQuickCapture} disabled={isSaving || !ideaText.trim()}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div style={{
          position: 'absolute', top: '70px', right: '20px', background: '#1e1f24', 
          border: '1px solid #2d2e35', borderRadius: '12px', padding: '20px', 
          width: '300px', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
        }}>
          <h4 style={{ marginBottom: '12px' }}>Edit Profile</h4>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>Display Name</label>
            <input 
              type="text" 
              style={{ width: '100%', background: '#09090b', border: '1px solid #2d2e35', borderRadius: '8px', padding: '10px', color: 'white' }}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>Avatar Image</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '50%', background: editImage ? `url(${editImage}) center/cover` : '#2d2e35',
                border: '1px solid #3f3f46', flexShrink: 0
              }} />
              <label 
                className="btn-primary" 
                style={{ 
                  cursor: isUploading ? 'default' : 'pointer', 
                  padding: '6px 12px', 
                  fontSize: '12px', 
                  background: 'transparent', 
                  border: '1px solid #3b82f6', 
                  color: '#3b82f6',
                  opacity: isUploading ? 0.5 : 1 
                }}
              >
                {isUploading ? 'Uploading...' : 'Upload Image'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} disabled={isUploading} />
              </label>
              {editImage && (
                <button 
                  onClick={() => setEditImage('')} 
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button className="btn-primary" style={{ background: 'transparent', border: '1px solid #2d2e35' }} onClick={() => setShowProfileModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSaveProfile}>Save</button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
