import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import '../pages/Home.css';
import '../index.css';
import NewNavbar from "./NewNavbar.jsx";
import './Menu.css';
import './Speech.css';

// OpenAI TTS voice mapping: gender + vibe → voice ID
// Male voices: echo (crisp), fable (expressive/British), onyx (deep)
// Female voices: nova (warm/friendly), shimmer (soft/upbeat)
const VOICE_MAP = {
  male: {
    friendly: 'echo',
    warm: 'fable',
    calm: 'onyx',
    energetic: 'echo',
  },
  female: {
    friendly: 'nova',
    warm: 'shimmer',
    calm: 'shimmer',
    energetic: 'nova',
  }
};

const VIBES = [
  { id: 'friendly', label: 'Friendly' },
  { id: 'warm', label: 'Warm and homely' },
  { id: 'calm', label: 'Calm and slow' },
  { id: 'energetic', label: 'Energetic coach' },
];

function Speech() {
  const navigate = useNavigate();
  const [gender, setGender] = useState('male');
  const [vibe, setVibe] = useState('friendly');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Load saved preferences on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('yeschef_voice_prefs'));
      if (saved) {
        if (saved.gender) setGender(saved.gender);
        if (saved.vibe) setVibe(saved.vibe);
      }
    } catch {
      // No saved prefs, use defaults
    }
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const voiceId = VOICE_MAP[gender]?.[vibe] || 'echo';

    // Persist to localStorage
    localStorage.setItem('yeschef_voice_prefs', JSON.stringify({
      gender,
      vibe,
      voiceId,
    }));

    // Dispatch a custom event so VoiceContext picks it up immediately
    window.dispatchEvent(new CustomEvent('voicePrefsChanged', {
      detail: { gender, vibe, voiceId }
    }));

    setMessage('Voice saved!');
    setSaving(false);
  };

  return (
    <div className="page">
      <NewNavbar
        showBackButton
        onBackClick={handleBack}
        onLogoClick={() => navigate('/')}
      />
      <div className="main-content">
        <div className="container layout-sm">
          <div className="page-title text-title">Your chef's voice</div>

          {/* Gender section */}
          <div className="speech-section">
            <div className="speech-section-header">
              <p className="text-lg content-pri-color">Gender</p>
              <p className="text-sm content-sec-color">Choose the gender's voice</p>
            </div>
            <label className="radio-row" htmlFor="gender-male">
              <input
                type="radio"
                id="gender-male"
                name="gender"
                value="male"
                checked={gender === 'male'}
                onChange={(e) => setGender(e.target.value)}
              />
              <span className="radio-custom" />
              <span className="text-lg">Male</span>
            </label>
            <label className="radio-row" htmlFor="gender-female">
              <input
                type="radio"
                id="gender-female"
                name="gender"
                value="female"
                checked={gender === 'female'}
                onChange={(e) => setGender(e.target.value)}
              />
              <span className="radio-custom" />
              <span className="text-lg">Female</span>
            </label>
          </div>

          {/* Vibe section */}
          <div className="speech-section">
            <div className="speech-section-header">
              <p className="text-lg content-pri-color">Vibe</p>
              <p className="text-sm content-sec-color">Choose the vibe you'd like your chef to sound.</p>
            </div>
            {VIBES.map((v) => (
              <label className="radio-row" key={v.id} htmlFor={`vibe-${v.id}`}>
                <input
                  type="radio"
                  id={`vibe-${v.id}`}
                  name="vibe"
                  value={v.id}
                  checked={vibe === v.id}
                  onChange={(e) => setVibe(e.target.value)}
                />
                <span className="radio-custom" />
                <span className="text-lg">{v.label}</span>
              </label>
            ))}
          </div>

          {message && (
            <div className="validation-box">
              <p className="text-sm pri-color" style={{ textAlign: "center" }}>{message}</p>
            </div>
          )}

          <div className="form-footer">
            <button
              className="md-button text-lg"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Speech;
