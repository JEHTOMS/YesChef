import React, { useState, useEffect, useRef, useCallback } from "react";
import { useVoice } from "../context/VoiceContext";
import { useLocation } from "react-router-dom";
import Modal from "../NewUI/Modal";
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

function FloatingAudioContainer() {
    const {
        isPlaying,
        isLoading,
        isListening,
        isProcessing,
        isVoiceModeActive,
        speechLevel,
        stopVoiceMode,
        pauseVoiceMode,
        resumeVoiceMode,
        currentReadingIndex,
        voiceState
    } = useVoice();

    const location = useLocation();
    const [loaderShrunk, setLoaderShrunk] = useState(false);
    const [loaderBouncing, setLoaderBouncing] = useState(false);
    const [commandsModalOpen, setCommandsModalOpen] = useState(false);
    const [position, setPosition] = useState(null); // null = use default CSS position
    const loaderShrinkTimeoutRef = useRef(null);
    const loaderBounceTimeoutRef = useRef(null);
    const containerRef = useRef(null);
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
    const hasDraggedRef = useRef(false);

    const isThinkingPhase = isVoiceModeActive && (isLoading || isProcessing) && !isPlaying && !isListening;
    const normalizedSpeechLevel = Math.min(1, Math.max(0, speechLevel || 0));

    const onFoodInfo = location.pathname === '/food-information';
    const shouldHide = !isVoiceModeActive || onFoodInfo;

    // Compute default position: 32px from right edge of .container, sitting above the footer
    useEffect(() => {
        if (shouldHide || position) return;
        const container = document.querySelector('.container');
        const footer = document.querySelector('.footer');
        const xRight = container
            ? container.getBoundingClientRect().right - 32 - 44
            : window.innerWidth - 32 - 44;
        const yTop = footer
            ? footer.getBoundingClientRect().top - 16 - 44 // 16px gap above footer
            : window.innerHeight - 24 - 44;
        setPosition({ x: xRight, y: yTop });
    }, [shouldHide, position]);

    const getWaveHeight = (baseHeight, barIndex) => {
        if (!isPlaying) return baseHeight;
        const multiplier = WAVE_BAR_SPEAK_MULTIPLIERS[barIndex] || 1;
        const minHeight = 4;
        const intensity = Math.min(1, normalizedSpeechLevel * 2.4);
        return Math.max(minHeight, minHeight + ((baseHeight - minHeight) * intensity * multiplier));
    };

    // Drag handlers
    const onPointerDown = useCallback((e) => {
        if (e.target.closest('#stopaudio-global') || e.target.closest('.help-icon-button')) return;
        isDraggingRef.current = true;
        hasDraggedRef.current = false;
        const currentPos = position || { x: 0, y: 0 };
        dragStartRef.current = { x: e.clientX, y: e.clientY, posX: currentPos.x, posY: currentPos.y };
        e.currentTarget.setPointerCapture(e.pointerId);
    }, [position]);

    const onPointerMove = useCallback((e) => {
        if (!isDraggingRef.current) return;
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            hasDraggedRef.current = true;
        }
        const newX = Math.max(0, Math.min(window.innerWidth - 44, dragStartRef.current.posX + dx));
        const newY = Math.max(0, Math.min(window.innerHeight - 44, dragStartRef.current.posY + dy));
        setPosition({ x: newX, y: newY });
    }, []);

    const onPointerUp = useCallback(() => {
        isDraggingRef.current = false;
    }, []);

    const handleClick = (e) => {
        e.stopPropagation();
        if (hasDraggedRef.current) return; // was a drag, not a click
        if (isThinkingPhase) return;
        if (e.target.closest('#stopaudio-global') || e.target.closest('.help-icon-button')) return;

        if (voiceState === 'idle') {
            const resumeFrom = currentReadingIndex >= 0 ? currentReadingIndex : 0;
            resumeVoiceMode(resumeFrom);
        } else {
            pauseVoiceMode();
        }
    };

    const handleStop = (e) => {
        e.stopPropagation();
        stopVoiceMode();
    };

    // Loader animation
    useEffect(() => {
        if (loaderShrinkTimeoutRef.current) clearTimeout(loaderShrinkTimeoutRef.current);
        if (loaderBounceTimeoutRef.current) clearTimeout(loaderBounceTimeoutRef.current);

        if (isThinkingPhase) {
            setLoaderShrunk(true);
            loaderBounceTimeoutRef.current = setTimeout(() => setLoaderBouncing(true), 320);
        } else {
            setLoaderBouncing(false);
            loaderShrinkTimeoutRef.current = setTimeout(() => setLoaderShrunk(false), 60);
        }

        return () => {
            if (loaderShrinkTimeoutRef.current) clearTimeout(loaderShrinkTimeoutRef.current);
            if (loaderBounceTimeoutRef.current) clearTimeout(loaderBounceTimeoutRef.current);
        };
    }, [isThinkingPhase]);

    // Reset position when voice mode restarts so it recalculates from .container
    useEffect(() => {
        if (!isVoiceModeActive) setPosition(null);
    }, [isVoiceModeActive]);

    if (shouldHide || !position) return null;

    return (<>
        <div
            ref={containerRef}
            className={`audio-container floating-audio ${isPlaying ? 'playing' : ''} ${isLoading || isProcessing ? 'loading' : ''} ${isListening ? 'listening' : ''} voice-active ${voiceState === 'idle' ? 'paused' : ''}`}
            onClick={handleClick}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: 1000,
                touchAction: 'none',
                cursor: isDraggingRef.current ? 'grabbing' : 'grab',
            }}
        >
            <div
                className={`audio-waveform ${isPlaying ? 'animating' : ''} ${isListening && !isPlaying ? 'listening' : ''} ${isThinkingPhase ? 'thinking' : ''} ${loaderShrunk ? 'shrunk' : ''} ${loaderBouncing ? 'bouncing' : ''}`}
                aria-hidden="true"
                data-tooltip={isPlaying || isListening ? 'Pause' : voiceState === 'idle' ? 'Resume' : ''}
            >
                {WAVE_BAR_HEIGHTS.map((height, index) => (
                    <span
                        key={index}
                        className={`wave-bar wave-bar-${index + 1}`}
                        style={{ '--bar-height': `${height}px`, '--dot-delay': `${index * 0.15}s`, '--active-height': `${getWaveHeight(height, index)}px` }}
                    />
                ))}
            </div>

            <div className="stopaudio-button" id="stopaudio-global" onClick={handleStop} style={{ cursor: 'pointer' }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="10" height="10" rx="2" fill="#F04DCC"/>
                </svg>
            </div>

            <div className="help-icon-button" onClick={(e) => { e.stopPropagation(); setCommandsModalOpen(true); }} style={{ cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.8175 9.75C9.99383 9.24875 10.3419 8.82608 10.8 8.55685C11.2581 8.28762 11.7967 8.1892 12.3204 8.27903C12.8441 8.36886 13.3191 8.64114 13.6613 9.04765C14.0035 9.45415 14.1908 9.96864 14.19 10.5C14.19 12 11.94 12.75 11.94 12.75M12 15.75H12.0075M19.5 12C19.5 16.1421 16.1421 19.5 12 19.5C7.85786 19.5 4.5 16.1421 4.5 12C4.5 7.85786 7.85786 4.5 12 4.5C16.1421 4.5 19.5 7.85786 19.5 12Z" stroke="#757575" strokeWidth="1.875" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
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
    </>
    );
}

export default FloatingAudioContainer;
