import React, { useState, useEffect, useRef } from "react";
import { useVoice } from "../context/VoiceContext";
import { useUser } from "../context/UserContext";
import Modal from "../NewUI/Modal";
import '../index.css';
import '../pages/Home.css';
import '../pages/FoodInfo.css';
import './Steps.css';

const WAVE_BAR_HEIGHTS = [12.1338, 29.1211, 14.5605, 7.28027];
const WAVE_BAR_SPEAK_MULTIPLIERS = [0.7, 1, 0.82, 0.6];

const QUICK_COMMANDS = [
    { title: 'Start / Begin Cooking', commands: ['Start', 'Begin', "Let's cook"] },
    { title: 'Next Step', commands: ['Next', 'Next step', 'Continue', "What's next"] },
    { title: 'Previous Step', commands: ['Previous', 'Previous step', 'Go back', 'Back', 'Last step'] },
    { title: 'Repeat Current Step', commands: ['Repeat', 'Again', 'What was that', 'Sorry', 'Come again'] },
    { title: 'Go To Step (N = Step number)', commands: ['Go to step {N}', 'Go back to step {N}'] },
    { title: 'Pause', commands: ['Pause', 'Stop'] },
];

function Steps({ steps = [], onStepClick, activeStep = 0, recipeName = '' }) {
    const { isPro } = useUser();
    const [collapsed, setCollapsed] = useState(true);
    const [audioCollapsed, setAudioCollapsed] = useState(true);
    const [loaderShrunk, setLoaderShrunk] = useState(false);
    const [loaderBouncing, setLoaderBouncing] = useState(false);
    const [commandsModalOpen, setCommandsModalOpen] = useState(false);
    const listRef = useRef(null);
    const audioContainerRef = useRef(null);
    const loaderShrinkTimeoutRef = useRef(null);
    const loaderBounceTimeoutRef = useRef(null);
    
    // Voice context for TTS and continuous conversation
    const { 
        isPlaying, 
        isLoading, 
        isListening,
        isProcessing,
        isVoiceModeActive,
        currentReadingIndex,
        speechLevel,
        startVoiceMode, 
        stopVoiceMode,
        pauseVoiceMode,
        resumeVoiceMode,
        setCurrentReadingIndex,
        voiceState
    } = useVoice();

    // Sync audio container collapsed state with voice mode
    useEffect(() => {
        setAudioCollapsed(!isVoiceModeActive);
    }, [isVoiceModeActive]);

    const isThinkingPhase = isVoiceModeActive && (isLoading || isProcessing) && !isPlaying && !isListening;
    const normalizedSpeechLevel = Math.min(1, Math.max(0, speechLevel || 0));

    const getWaveHeight = (baseHeight, barIndex) => {
        if (!isPlaying) return baseHeight;

        const multiplier = WAVE_BAR_SPEAK_MULTIPLIERS[barIndex] || 1;
        const minHeight = 4;
        const intensity = Math.min(1, normalizedSpeechLevel * 2.4);
        const activeHeight = minHeight + ((baseHeight - minHeight) * intensity * multiplier);

        return Math.max(minHeight, activeHeight);
    };

    const handleItemClick = (e, idx) => {
        // Only prevent default for anchor links, not touch/click events
        if (e.target.tagName === 'A') {
            e.preventDefault();
        }
        // If collapsed, expand first and then navigate
        if (collapsed) setCollapsed(false);

        // If voice mode is active, pause audio and sync to the tapped step
        if (isVoiceModeActive) {
            pauseVoiceMode();
            setCurrentReadingIndex(idx);
        }

        if (typeof onStepClick === 'function') onStepClick(idx);
    };

    const toggleCollapsed = (e) => {
        // prevent toggling when clicking a specific item (handled in item handler)
        if (e && e.target && (e.target.closest && e.target.closest('.step-item'))) return;
        setCollapsed((c) => !c);
    };

    // Collapse when clicking or scrolling/touching outside the expanded list
    useEffect(() => {
        if (collapsed) return; // only active when expanded

        const onDocClick = (ev) => {
            if (!listRef.current) return;
            if (!listRef.current.contains(ev.target)) {
                setCollapsed(true);
            }
        };

        const onScrollOrWheel = (ev) => {
            if (!listRef.current) return;
            // if the event target is outside the list, collapse
            if (!listRef.current.contains(ev.target)) {
                setCollapsed(true);
            }
        };

        document.addEventListener('click', onDocClick, true);
        window.addEventListener('wheel', onScrollOrWheel, { passive: true });
        window.addEventListener('scroll', onScrollOrWheel, { passive: true });
        window.addEventListener('touchstart', onScrollOrWheel, { passive: true });

        return () => {
            document.removeEventListener('click', onDocClick, true);
            window.removeEventListener('wheel', onScrollOrWheel);
            window.removeEventListener('scroll', onScrollOrWheel);
            window.removeEventListener('touchstart', onScrollOrWheel);
        };
    }, [collapsed]);

    // Auto-scroll to currently reading step and sync with parent activeStep
    useEffect(() => {
        if (currentReadingIndex >= 0) {
            // Always notify parent so the Directions swiper scrolls
            if (typeof onStepClick === 'function' && currentReadingIndex !== activeStep) {
                onStepClick(currentReadingIndex);
            }
            // Also scroll within the Steps list if visible
            if (listRef.current) {
                const stepEl = listRef.current.querySelector(`#step-${currentReadingIndex + 1}`);
                if (stepEl) {
                    stepEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    }, [currentReadingIndex, onStepClick, activeStep]);

    useEffect(() => {
        if (loaderShrinkTimeoutRef.current) {
            clearTimeout(loaderShrinkTimeoutRef.current);
            loaderShrinkTimeoutRef.current = null;
        }
        if (loaderBounceTimeoutRef.current) {
            clearTimeout(loaderBounceTimeoutRef.current);
            loaderBounceTimeoutRef.current = null;
        }

        if (isThinkingPhase) {
            setLoaderShrunk(true);
            loaderBounceTimeoutRef.current = setTimeout(() => {
                setLoaderBouncing(true);
            }, 320);
        } else {
            setLoaderBouncing(false);
            loaderShrinkTimeoutRef.current = setTimeout(() => {
                setLoaderShrunk(false);
            }, 60);
        }

        return () => {
            if (loaderShrinkTimeoutRef.current) {
                clearTimeout(loaderShrinkTimeoutRef.current);
            }
            if (loaderBounceTimeoutRef.current) {
                clearTimeout(loaderBounceTimeoutRef.current);
            }
        };
    }, [isThinkingPhase]);

    // Handle audio container click — simple toggle:
    // Click 1: Expand + start voice mode → fully automatic from here (listens → speaks → listens)
    // Click while active & idle (paused): Resume automatically
    // Click while active & speaking/listening: Pause
    const handleAudioContainerClick = (e) => {
        e.stopPropagation();

        // Don't allow pause/interruption while AI is thinking
        if (isThinkingPhase) {
            return;
        }
        
        // If clicking stop button, don't toggle
        if (e.target.closest('#stopaudio')) {
            return;
        }
        
        if (!isVoiceModeActive) {
            // Start voice mode — audio container expands and voice is fully automatic
            setAudioCollapsed(false);
            if (steps.length > 0) {
                startVoiceMode(steps, activeStep, recipeName);
            }
        } else if (voiceState === 'idle') {
            // Paused — resume from current step automatically
            const resumeFrom = currentReadingIndex >= 0 ? currentReadingIndex : activeStep;
            resumeVoiceMode(resumeFrom);
        } else {
            // Currently speaking/listening/processing — pause
            pauseVoiceMode();
        }
    };

    // Handle stop button - stop voice mode completely
    const handleStop = (e) => {
        e.stopPropagation();
        stopVoiceMode();
        setAudioCollapsed(true);
    };

    // Handle help icon click - open quick commands modal
    const handleHelpClick = (e) => {
        e.stopPropagation();
        setCommandsModalOpen(true);
    };

    // Determine the effective active step (voice reading takes priority)
    const effectiveActiveStep = currentReadingIndex >= 0 ? currentReadingIndex : activeStep;

    return (
        <div className="footer no-bg">
            <div className="container layout-sm" style={{alignItems: "flex-end"}}>
                <div className={`store-container ${collapsed ? 'collapsed' : ''}`}>
                    <div className="store-header">
                        <h2 className="text-subtitle">Directions</h2>
                        <button className="icon-button" id="close-stores" ><svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20.75 7.25L7.25 20.75M7.25 7.25L20.75 20.75" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
</button>
                    </div>
                    <div className="store-wrapper">
                        {steps && steps.length > 0 ? (
                            <ul ref={listRef} className={`step-list ${collapsed ? 'collapsed' : 'expanded'}`} onClick={toggleCollapsed}>
                                {steps.map((step, idx) => {
                                    const isActive = idx === effectiveActiveStep;
                                    const isPast = idx < effectiveActiveStep;
                                    const isFuture = idx > effectiveActiveStep;
                                    const isReading = idx === currentReadingIndex;
                                    const itemClass = `step-item text-lg ${isActive ? 'active-step' : ''} ${isPast ? 'past-step' : ''} ${isFuture ? 'future-step' : ''} ${isReading ? 'reading-step' : ''}`;
                                    
                                    return (
                                    <li key={step.id || idx} className={itemClass} onClick={(e) => handleItemClick(e, idx)} id={`step-${idx + 1}`}>
                                        <div 
                                            className={`step-number icon-button ${isActive ? 'step-number-active' : ''}`}
                                            title={`Step ${idx + 1}`}
                                        >
                                            {idx + 1}
                                        </div>
                                        <span className="step-type" id={`step-${idx + 1}-text`}>{step.text}</span>
                                    </li>
                                )})}
                            </ul>
                        ) : (
                            <div className="text-lg">No steps available.</div>
                        )}
                    </div>
                </div>
                {isPro && (
                <div
                    ref={audioContainerRef}
                    className={`audio-container ${audioCollapsed ? 'collapsed' : ''} ${isPlaying ? 'playing' : ''} ${isLoading || isProcessing ? 'loading' : ''} ${isListening ? 'listening' : ''} ${isVoiceModeActive ? 'voice-active' : ''} ${isVoiceModeActive && voiceState === 'idle' ? 'paused' : ''}`}
                    onClick={handleAudioContainerClick}
                >
                    {/* Caption bubble - hidden for now */}

                    {/* Waveform / Play icon */}
                    <div
                        className={`audio-waveform ${isPlaying ? 'animating' : ''} ${isListening && !isPlaying ? 'listening' : ''} ${isThinkingPhase ? 'thinking' : ''} ${loaderShrunk ? 'shrunk' : ''} ${loaderBouncing ? 'bouncing' : ''}`}
                        aria-hidden="true"
                        data-tooltip={isPlaying || isListening ? 'Pause' : isVoiceModeActive && voiceState === 'idle' ? 'Resume' : 'Start voice mode'}
                    >
                        {WAVE_BAR_HEIGHTS.map((height, index) => (
                            <span
                                key={index}
                                className={`wave-bar wave-bar-${index + 1}`}
                                style={{ '--bar-height': `${height}px`, '--dot-delay': `${index * 0.15}s`, '--active-height': `${getWaveHeight(height, index)}px` }}
                            />
                        ))}
                    </div>

                    {/* Stop button - ends voice mode */}
                    <div className="stopaudio-button" id="stopaudio" onClick={handleStop}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="10" height="10" rx="2" fill="#F04DCC"/>
                        </svg>
                    </div>

                    {/* Help icon - quick commands */}
                    <div className="help-icon-button" onClick={handleHelpClick}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.8175 9.75C9.99383 9.24875 10.3419 8.82608 10.8 8.55685C11.2581 8.28762 11.7967 8.1892 12.3204 8.27903C12.8441 8.36886 13.3191 8.64114 13.6613 9.04765C14.0035 9.45415 14.1908 9.96864 14.19 10.5C14.19 12 11.94 12.75 11.94 12.75M12 15.75H12.0075M19.5 12C19.5 16.1421 16.1421 19.5 12 19.5C7.85786 19.5 4.5 16.1421 4.5 12C4.5 7.85786 7.85786 4.5 12 4.5C16.1421 4.5 19.5 7.85786 19.5 12Z" stroke="#757575" strokeWidth="1.875" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>
                )}
            </div>

            <Modal
                title="Quick commands"
                subtitle="For faster responses"
                isOpen={commandsModalOpen}
                onClose={() => setCommandsModalOpen(false)}
                content={
                    <div className="quick-commands-list">
                        {QUICK_COMMANDS.map((group) => (
                            <div key={group.title} className="quick-commands-group">
                                <span className="text-sm content-sec-color">{group.title}</span>
                                <div className="quick-commands-items">
                                    {group.commands.map((cmd) => (
                                        <span key={cmd} className="tools-item text-sm">{cmd}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                }
            />
        </div>
    );
}

export default Steps;