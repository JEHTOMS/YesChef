import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { useVoice } from "../context/VoiceContext";
import { parseTimeToSeconds } from '../utils/timeUtils';
import timerBridge from '../timerBridge';
import '../index.css';
import '../pages/Home.css';
import './Directions.css';
import alarmSound from '../alarm-clock-short-6402.mp3';

// Import Swiper and required modules
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Keyboard } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/mousewheel';

const Directions = forwardRef(function Directions({ steps = [], onActiveChange, ingredients = [], servingMultiplier = 1 }, ref) {
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const swiperRef = useRef(null);
    // When we change slides programmatically (voice nav / clicking a step), don't auto-pause voice mode.
    const suppressVoicePauseRef = useRef(false);
    const suppressResetTimeoutRef = useRef(null);
    // timers state (seconds remaining) keyed by unique timer ID (stepIndex-timerIndex)
    const [timers, setTimers] = useState({});
    const intervalsRef = useRef({});
    // audio ref for alarm playback
    const alarmRef = useRef(null);
    // track whether we've auto-played the alarm for a given step index
    const alarmPlayedRef = useRef({});
    const [shimmerTrigger, setShimmerTrigger] = useState(null);

    // Voice context — stop voice mode when user manually swipes
    const { isVoiceModeActive, stopVoiceMode, setCurrentReadingIndex, currentReadingIndex } = useVoice();

    const formatTime = useCallback((secs) => {
        if (secs == null) return '0:00';
        const n = Number(secs);
        if (!Number.isFinite(n) || Number.isNaN(n) || n <= 0) return '0:00';
        const s = Math.floor(n);
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${String(sec).padStart(2, '0')}`;
    }, []);

    // parseTimeToSeconds is now imported from utils/timeUtils.js

    const clearTimer = useCallback((timerId) => {
        const id = intervalsRef.current[timerId];
        if (id) {
            clearInterval(id);
            delete intervalsRef.current[timerId];
        }
    }, []);

    const startTimer = useCallback((timerId, initialSeconds) => {
        if (!initialSeconds || initialSeconds <= 0) return;
        clearTimer(timerId);
        setTimers((prev) => ({ ...prev, [timerId]: initialSeconds }));
        intervalsRef.current[timerId] = setInterval(() => {
            setTimers((prev) => {
                const cur = prev[timerId] ?? 0;
                if (cur <= 1) {
                    // reach zero, stop interval and set 0
                    clearTimer(timerId);
                    // Sync bridge remaining to 0
                    if (timerBridge.activeTimers[timerId]) {
                        timerBridge.activeTimers[timerId].remaining = 0;
                    }
                    // mark 0 and allow playing alarm below via effect
                    return { ...prev, [timerId]: 0 };
                }
                // Sync bridge with remaining time
                if (timerBridge.activeTimers[timerId]) {
                    timerBridge.activeTimers[timerId].remaining = cur - 1;
                }
                return { ...prev, [timerId]: cur - 1 };
            });
        }, 1000);
    }, [clearTimer]);

    // restart the timer (reset to initial and start)
    const restartTimer = useCallback((timerId, initialSeconds) => {
        clearTimer(timerId);
        startTimer(timerId, initialSeconds);
    }, [clearTimer, startTimer]);

    // Register startTimerFn on the bridge so VoiceContext can start timers programmatically
    useEffect(() => {
        timerBridge.startTimerFn = (stepIndex, timeText, seconds) => {
            // Replicate the replacement-finding logic to resolve the correct timerId
            const raw = steps[stepIndex]?.text || steps[stepIndex]?.instruction || '';
            if (!raw) return;

            const replacements = [];
            const heatPattern = /\b(?:(?:over|on|at|to)\s+)?((?:low|medium(?:\s*-\s*(?:low|high)|\s+(?:to|heat))?|medium\s*-\s*high|high)(?:\s+heat)?|\d{2,3}°[FC]?|\d{2,3}\s*degrees?\s*[FC]?)\b/gi;
            const timePattern = /\b(?:about\s+)?(\d+(?:\.\d+)?(?::\d{1,2})?)\s*(?:to\s+\d+\s*)?(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|seconds)\b/gi;

            let match;
            heatPattern.lastIndex = 0;
            while ((match = heatPattern.exec(raw)) !== null) {
                replacements.push({ start: match.index, type: 'heat' });
            }
            timePattern.lastIndex = 0;
            while ((match = timePattern.exec(raw)) !== null) {
                replacements.push({ start: match.index, type: 'time', text: match[0] });
            }
            replacements.sort((a, b) => a.start - b.start);

            // Find the replacement index that matches our timer text
            const idx = replacements.findIndex(r => r.type === 'time' && r.text === timeText);
            if (idx >= 0) {
                const timerId = `${stepIndex}-${idx}`;
                startTimer(timerId, seconds);
                timerBridge.activeTimers[timerId] = { stepIndex, seconds, label: timeText, remaining: seconds };
            }
        };
        return () => { timerBridge.startTimerFn = null; };
    }, [startTimer, steps]);

    // Listen for voice-initiated timer start events (fallback)
    useEffect(() => {
        const handler = (e) => {
            const { stepIndex, seconds, label } = e.detail;
            if (timerBridge.startTimerFn) {
                timerBridge.startTimerFn(stepIndex, label, seconds);
            }
        };
        window.addEventListener('yeschef:timer-start', handler);
        return () => window.removeEventListener('yeschef:timer-start', handler);
    }, []);

    // cleanup on unmount
    useEffect(() => {
        return () => {
            Object.values(intervalsRef.current).forEach((id) => clearInterval(id));
            intervalsRef.current = {};
            // Clear bridge state
            timerBridge.activeTimers = {};
            timerBridge.startTimerFn = null;
            if (suppressResetTimeoutRef.current) {
                clearTimeout(suppressResetTimeoutRef.current);
                suppressResetTimeoutRef.current = null;
            }
            // stop audio on unmount
            if (alarmRef.current) {
                try { alarmRef.current.pause(); alarmRef.current.currentTime = 0; } catch (e) {}
            }
        };
    }, []);
    
    // Set up Swiper instance
    useEffect(() => {
        if (swiperRef.current?.swiper) {
            const swiper = swiperRef.current.swiper;
            
            // Jump to slide if activeStepIndex is changed externally
            if (swiper.activeIndex !== activeStepIndex) {
                suppressVoicePauseRef.current = true;
                swiper.slideTo(activeStepIndex, 600);
                // Clear suppress flag after animation completes
                if (suppressResetTimeoutRef.current) clearTimeout(suppressResetTimeoutRef.current);
                suppressResetTimeoutRef.current = setTimeout(() => {
                    suppressVoicePauseRef.current = false;
                    suppressResetTimeoutRef.current = null;
                }, 700);
            }
        }
    }, [activeStepIndex]);

    // Keep swiper aligned to voice reading index (auto-scroll when voice says next step)
    useEffect(() => {
        if (currentReadingIndex == null || currentReadingIndex < 0) return;
        if (!swiperRef.current?.swiper) return;
        const swiper = swiperRef.current.swiper;
        if (swiper.activeIndex !== currentReadingIndex) {
            suppressVoicePauseRef.current = true;
            swiper.slideTo(currentReadingIndex, 600);
            if (suppressResetTimeoutRef.current) clearTimeout(suppressResetTimeoutRef.current);
            suppressResetTimeoutRef.current = setTimeout(() => {
                suppressVoicePauseRef.current = false;
                suppressResetTimeoutRef.current = null;
            }, 700);
        }
    }, [currentReadingIndex]);
    
    // Handle slide change from Swiper
    const handleSlideChange = (swiper) => {
        const newIndex = swiper.activeIndex;
        setActiveStepIndex(newIndex);

        const isSuppressed = suppressVoicePauseRef.current;

        // Always keep voice index synced to the currently visible step
        // so resume continues from exactly where the user is.
        setCurrentReadingIndex(newIndex);

        // If voice mode is active, stop it when user manually scrolls
        if (isVoiceModeActive && !isSuppressed) {
            stopVoiceMode();
        }

        if (typeof onActiveChange === 'function') {
            onActiveChange(newIndex);
        }
    };

    // Stop alarm when the active step changes (i.e., user scrolls past a step)
    useEffect(() => {
        // pause and reset alarm when changing active step
        return () => {
            if (alarmRef.current) {
                try { alarmRef.current.pause(); alarmRef.current.currentTime = 0; } catch (e) {}
            }
        };
    }, [activeStepIndex]);

    // trigger the shimmer animation each time a slide becomes active
    useEffect(() => {
        setShimmerTrigger(activeStepIndex);
    // clear trigger after animation completes (1s * 2 loops = 1s here)
    const t = setTimeout(() => setShimmerTrigger(null), 1100);
    return () => clearTimeout(t);
    }, [activeStepIndex]);

    // initialize alarm audio once
    useEffect(() => {
        try {
            alarmRef.current = new Audio(alarmSound);
            // ensure it doesn't loop automatically
            alarmRef.current.loop = false;
        } catch (e) {
            alarmRef.current = null;
        }
        return () => {
            if (alarmRef.current) {
                try { alarmRef.current.pause(); alarmRef.current.currentTime = 0; } catch (e) {}
                alarmRef.current = null;
            }
        };
    }, []);

    // when a timer reaches 0 and its step is active, play the alarm once; allow one replay while still active
    // Also dispatch yeschef:timer-complete for voice-started timers tracked in the bridge
    useEffect(() => {
        // Dispatch timer-complete events for any bridge-tracked timer that hit zero
        Object.keys(timers).forEach(timerId => {
            if (timers[timerId] === 0 && timerBridge.activeTimers[timerId]) {
                const timerInfo = timerBridge.activeTimers[timerId];
                if (!timerInfo._notified) {
                    timerInfo._notified = true;
                    window.dispatchEvent(new CustomEvent('yeschef:timer-complete', {
                        detail: {
                            timerId,
                            stepIndex: timerInfo.stepIndex,
                            label: timerInfo.label
                        }
                    }));
                }
            }
        });

        // check if any timer for the current active step has reached 0
        const activeTimerPrefix = `${activeStepIndex}-`;
        const hasZeroTimer = Object.keys(timers).some(timerId =>
            timerId.startsWith(activeTimerPrefix) && timers[timerId] === 0
        );

        if (hasZeroTimer) {
            // only auto-play once per activation unless re-started
            if (!alarmPlayedRef.current[activeStepIndex]) {
                alarmPlayedRef.current[activeStepIndex] = 1; // mark played once
                if (alarmRef.current) {
                    // play, but guard against autoplay blocking by catching promise
                    const p = alarmRef.current.play();
                    if (p && p.catch) p.catch(() => {});
                }
            }
        }
    }, [timers, activeStepIndex]);
    
    // Navigate directly to a specific step (stable callback so hooks lint is satisfied)
    const goToStep = useCallback((index) => {
        if (swiperRef.current?.swiper) {
            suppressVoicePauseRef.current = true;
            swiperRef.current.swiper.slideTo(index, 600);
            // Clear suppress flag after animation completes
            if (suppressResetTimeoutRef.current) clearTimeout(suppressResetTimeoutRef.current);
            suppressResetTimeoutRef.current = setTimeout(() => {
                suppressVoicePauseRef.current = false;
                suppressResetTimeoutRef.current = null;
            }, 700);
        }
    }, []);

    // expose goToStep to parent via ref
    useImperativeHandle(ref, () => ({
        goToStep
    }), [goToStep]);

    // notify parent of initial active step on mount
    useEffect(() => {
        if (typeof onActiveChange === 'function') onActiveChange(activeStepIndex);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!steps.length) {
        return (
            <div className="container layout-sm">
                <div className="directions">
                    <p className="text-lg">No directions available.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container layout-sm directions-container">
            <div className="directions">
                <Swiper
                    ref={swiperRef}
                    direction="vertical"
                    spaceBetween={0}
                    slidesPerView={'auto'}
                    modules={[Mousewheel, Keyboard]}
                    roundLengths={true}
                    mousewheel={{
                        enabled: true,
                        forceToAxis: true,
                        thresholdDelta: 10,
                        thresholdTime: 80,
                        releaseOnEdges: true,
                        eventsTarget: 'container'
                    }}
                    keyboard={{ enabled: true }}
                    speed={600}
                    threshold={5}
                    centeredSlides={true}
                    onSlideChange={handleSlideChange}
                    className="directions-swiper"
                    resistance={true}
                    resistanceRatio={0.9}
                    initialSlide={activeStepIndex}
                >
                    {steps.map((step, index) => {
                        const isActive = index === activeStepIndex;
                        const isDisabled = !isActive;
                        
                        return (
                            <SwiperSlide key={step.id || index} className="direction-slide">
                                <div 
                                    className={`steps${isDisabled ? ' disabled-step' : ''}`} 
                                    id={`step-${index + 1}`}
                                >
                                    <div className={`step-header${isDisabled ? ' disabled-step' : ''}`}>
                                        <a
                                            href={step.videoLink || `#step-${index + 1}`}
                                            className="step-link text-lg"
                                            onClick={(e) => {
                                                if (step.videoLink) {
                                                    // Open video at specific timestamp
                                                    window.open(step.videoLink, '_blank');
                                                } else {
                                                    // Navigate to step
                                                    e.preventDefault();
                                                    goToStep(index);
                                                }
                                            }}
                                            target={step.videoLink ? "_blank" : undefined}
                                            rel={step.videoLink ? "noopener noreferrer" : undefined}
                                        >
                                            Step {index + 1} <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="path-1-inside-1_618_16948" fill="white">
<path d="M0 0H22.5V22.5H0V0Z"/>
</mask>
<path d="M0 22.5H0.5V0H0H-0.5V22.5H0Z" fill="black" fill-opacity="0.2" mask="url(#path-1-inside-1_618_16948)"/>
<path d="M6.5625 15.9375L15.9375 6.5625M15.9375 6.5625H6.5625M15.9375 6.5625V15.9375" stroke="#737373" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
                                        </a>
                                        {step.ingredients && step.ingredients.length > 0 && (
                                            <ul className="step-ingredients text-sm">
                                                {step.ingredients.map((ingredient, idx) => (
                                                    <li key={idx} id={`step-${index + 1}-ingredient-${idx + 1}`}>
                                                        {ingredient}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <div className="step-content">
                                        <h1 className="text-title">
{(() => {
                                                // INLINE-ONLY rendering: parse instruction text and wrap time/heat phrases with spans
                                                const raw = step.text || step.instruction || '';
                                                if (!raw) return null;

                                                const replacements = [];

                                                // Enhanced heat regex to catch more patterns including temperatures
                                                const heatPattern = /\b(?:(?:over|on|at|to)\s+)?((?:low|medium(?:\s*-\s*(?:low|high)|\s+(?:to|heat))?|medium\s*-\s*high|high)(?:\s+heat)?|\d{2,3}°[FC]?|\d{2,3}\s*degrees?\s*[FC]?)\b/gi;
                                                
                                                // Enhanced time regex to catch more patterns including "about X minutes"
                                                const timePattern = /\b(?:about\s+)?(\d+(?:\.\d+)?(?::\d{1,2})?)\s*(?:to\s+\d+\s*)?(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|seconds)\b/gi;

                                                let match;
                                                
                                                // Find all heat matches
                                                heatPattern.lastIndex = 0;
                                                while ((match = heatPattern.exec(raw)) !== null) {
                                                    replacements.push({
                                                        start: match.index,
                                                        end: match.index + match[0].length,
                                                        type: 'heat',
                                                        text: match[0],
                                                        heatValue: match[1] || match[0]
                                                    });
                                                }

                                                // Find all time matches
                                                timePattern.lastIndex = 0;
                                                while ((match = timePattern.exec(raw)) !== null) {
                                                    replacements.push({
                                                        start: match.index,
                                                        end: match.index + match[0].length,
                                                        type: 'time',
                                                        text: match[0],
                                                        timeValue: match[0]
                                                    });
                                                }

                                                // Find ingredient quantities to scale
                                                if (servingMultiplier !== 1 && ingredients.length > 0) {
                                                    // Build a set of ranges already claimed by heat/time
                                                    const claimed = replacements.map(r => [r.start, r.end]);

                                                    // Also skip "Step N" patterns so step numbers don't get scaled
                                                    const stepNumPattern = /\bstep\s+\d+/gi;
                                                    let stepMatch;
                                                    while ((stepMatch = stepNumPattern.exec(raw)) !== null) {
                                                        claimed.push([stepMatch.index, stepMatch.index + stepMatch[0].length]);
                                                    }

                                                    const isInClaimed = (s, e) => claimed.some(([cs, ce]) => s < ce && e > cs);

                                                    // Common units to match after a number
                                                    const unitWords = '(?:cups?|c\\.?|tbsp?s?\\.?|tablespoons?|tsps?\\.?|teaspoons?|oz\\.?|ounces?|lbs?\\.?|pounds?|g\\.?|grams?|kg\\.?|kilograms?|ml\\.?|milliliters?|liters?|l\\.?|quarts?|qt\\.?|pints?|pt\\.?|gallons?|gal\\.?|pinch(?:es)?|dash(?:es)?|cloves?|slices?|pieces?|stalks?|sprigs?|bunche?s?|cans?|packages?|sticks?|heads?)?';

                                                    // Match numbers (including fractions like 1/2, 1 1/2) optionally followed by a unit
                                                    const qtyPattern = new RegExp(
                                                        `\\b(\\d+(?:\\.\\d+)?(?:\\s*/\\s*\\d+)?(?:\\s+\\d+/\\d+)?)\\s*${unitWords}\\b`,
                                                        'gi'
                                                    );

                                                    let qtyMatch;
                                                    qtyPattern.lastIndex = 0;
                                                    while ((qtyMatch = qtyPattern.exec(raw)) !== null) {
                                                        const numStart = qtyMatch.index;
                                                        const numEnd = numStart + qtyMatch[1].length;

                                                        // Skip if overlaps with heat/time
                                                        if (isInClaimed(numStart, numEnd)) continue;

                                                        // Parse the number (handle fractions)
                                                        const numStr = qtyMatch[1].trim();
                                                        let originalVal;
                                                        if (numStr.includes('/')) {
                                                            const parts = numStr.split(/\s+/);
                                                            if (parts.length === 2) {
                                                                // Mixed fraction: "1 1/2"
                                                                const [num, den] = parts[1].split('/');
                                                                originalVal = parseFloat(parts[0]) + parseFloat(num) / parseFloat(den);
                                                            } else {
                                                                // Simple fraction: "1/2"
                                                                const [num, den] = parts[0].split('/');
                                                                originalVal = parseFloat(num) / parseFloat(den);
                                                            }
                                                        } else {
                                                            originalVal = parseFloat(numStr);
                                                        }

                                                        if (!Number.isFinite(originalVal) || originalVal <= 0) continue;

                                                        const scaled = originalVal * servingMultiplier;
                                                        // Round to whole number unless fractional makes sense (e.g. 0.5, 1.5 for halves)
                                                        const remainder = scaled % 1;
                                                        const keepDecimal = Math.abs(remainder - 0.25) < 0.01 || Math.abs(remainder - 0.5) < 0.01 || Math.abs(remainder - 0.75) < 0.01;
                                                        const scaledStr = keepDecimal ? scaled.toFixed(1).replace(/\.0$/, '') : String(Math.round(scaled));

                                                        if (scaledStr !== numStr) {
                                                            replacements.push({
                                                                start: numStart,
                                                                end: numEnd,
                                                                type: 'quantity',
                                                                text: scaledStr,
                                                                originalText: numStr
                                                            });
                                                        }
                                                    }
                                                }

                                                // Sort by position to process in order
                                                replacements.sort((a, b) => a.start - b.start);

                                                if (replacements.length === 0) {
                                                    return raw; // No matches, return plain text
                                                }

                                                // Build JSX with inline spans
                                                const elements = [];
                                                let lastEnd = 0;

                                                replacements.forEach((repl, idx) => {
                                                    // Add text before this replacement
                                                    if (repl.start > lastEnd) {
                                                        elements.push(raw.slice(lastEnd, repl.start));
                                                    }

                                                    // Add the span for this replacement
                                                    if (repl.type === 'heat') {
                                                        const heatClass = repl.heatValue.toLowerCase()
                                                            .replace(/\s+heat\b/, '')
                                                            .replace(/\s+/g, '-')
                                                            .replace(/[^a-z0-9-]/g, '')
                                                            .replace(/degrees?/g, 'deg')
                                                            .replace(/^(\d+)-deg-([fc])$/, '$1$2'); // "350-deg-f" -> "350f"
                                                        
                                                        elements.push(
                                                            <span 
                                                                key={`heat-${idx}`} 
                                                                className={`heat-${heatClass}${isDisabled ? ' disabled-step' : ''}${(isActive && shimmerTrigger === index) ? ' shimmer' : ''}`}
                                                            >
                                                                {repl.text}
                                                            </span>
                                                        );
                                                    } else if (repl.type === 'time') {
                                                        // Use unique timer ID for each time span in each step
                                                        const timerId = `${index}-${idx}`;
                                                        // Use the actual parsed time from the text match, not step.time
                                                        const timeSeconds = parseTimeToSeconds(repl.timeValue);
                                                        const displayTime = (timers[timerId] != null && Number.isFinite(Number(timers[timerId]))) ? timers[timerId] : timeSeconds;
                                                        
                                                        elements.push(
                                                            <span key={`time-${idx}`} className="time-wrapper">
                                                                <span
                                                                    className={`time timer${isDisabled ? ' disabled-step' : ''}`}
                                                                    onClick={() => {
                                                                        if (!isActive || !timeSeconds) return;
                                                                        const cur = timers[timerId];
                                                                        
                                                                        if (cur === 0) {
                                                                            // Stop alarm
                                                                            if (alarmRef.current) {
                                                                                try { 
                                                                                    alarmRef.current.pause(); 
                                                                                    alarmRef.current.currentTime = 0; 
                                                                                } catch (e) {}
                                                                            }
                                                                            delete alarmPlayedRef.current[index];
                                                                            return;
                                                                        }
                                                                        
                                                                        if (intervalsRef.current[timerId]) {
                                                                            // Pause timer
                                                                            clearTimer(timerId);
                                                                            return;
                                                                        }
                                                                        
                                                                        // Start/resume timer
                                                                        const startFrom = (cur != null && Number.isFinite(cur)) ? cur : timeSeconds;
                                                                        startTimer(timerId, startFrom);
                                                                    }}
                                                                    onDoubleClick={() => {
                                                                        if (!isActive || !timeSeconds) return;
                                                                        restartTimer(timerId, timeSeconds);
                                                                    }}
                                                                >
                                                                    {formatTime(displayTime)}
                                                                </span>
                                                                <span className="minutes-text">minutes</span>
                                                            </span>
                                                        );
                                                    } else if (repl.type === 'quantity') {
                                                        elements.push(repl.text);
                                                    }

                                                    lastEnd = repl.end;
                                                });

                                                // Add remaining text after last replacement
                                                if (lastEnd < raw.length) {
                                                    elements.push(raw.slice(lastEnd));
                                                }

                                                return elements;
                                            })()}
                                        </h1>
                                    </div>
                                </div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </div>
        </div>
    );
});

export default Directions;