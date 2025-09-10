import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
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

const Directions = forwardRef(function Directions({ steps = [], onActiveChange }, ref) {
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const swiperRef = useRef(null);
    // timers state (seconds remaining) keyed by unique timer ID (stepIndex-timerIndex)
    const [timers, setTimers] = useState({});
    const intervalsRef = useRef({});
    // audio ref for alarm playback
    const alarmRef = useRef(null);
    // track whether we've auto-played the alarm for a given step index
    const alarmPlayedRef = useRef({});
    const [shimmerTrigger, setShimmerTrigger] = useState(null);

    const formatTime = useCallback((secs) => {
        if (secs == null) return '0:00';
        const n = Number(secs);
        if (!Number.isFinite(n) || Number.isNaN(n) || n <= 0) return '0:00';
        const s = Math.floor(n);
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${String(sec).padStart(2, '0')}`;
    }, []);

    // Parse a step.time value into seconds.
    // Accepts numbers (minutes), strings like '5', '5 mins', '1:30', '90s', or hours like '1.5 hours', '1 hr', '2h'.
    const parseTimeToSeconds = useCallback((timeValue) => {
        if (timeValue == null) return 0;
        // If already a finite number, assume minutes
        if (typeof timeValue === 'number' && Number.isFinite(timeValue)) {
            return Math.max(0, Math.floor(timeValue * 60));
        }
        const s = String(timeValue).trim();
        if (!s) return 0;

        // If format mm:ss or m:ss
        if (/^\d+:\d{1,2}$/.test(s)) {
            const [mins, secs] = s.split(':').map(Number);
            if (Number.isFinite(mins) && Number.isFinite(secs)) {
                return Math.max(0, mins * 60 + Math.floor(secs));
            }
        }

        // Hours like '1.5 hours', '1 hr', '2h'
        const hoursMatch = s.match(/([0-9]*\.?[0-9]+)\s*(h|hr|hrs|hour|hours)\b/i);
        if (hoursMatch) {
            const num = Number(hoursMatch[1]);
            if (Number.isFinite(num)) return Math.max(0, Math.floor(num * 3600));
        }

        // If contains seconds unit like '90s' or '30 sec'
        const secondsMatch = s.match(/(\d+)\s*s(ec)?/i);
        if (secondsMatch) return Math.max(0, Number(secondsMatch[1]));

        // Extract a leading number (could be minutes)
        const numMatch = s.match(/([0-9]*\.?[0-9]+)/);
        if (numMatch) {
            const num = Number(numMatch[1]);
            if (Number.isFinite(num)) {
                // default assume minutes unless string contains 'sec' or 's'
                const isSeconds = /sec|s\b/i.test(s) && !/min/i.test(s);
                return Math.max(0, Math.floor(isSeconds ? num : num * 60));
            }
        }

        return 0;
    }, []);

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
                    // mark 0 and allow playing alarm below via effect
                    return { ...prev, [timerId]: 0 };
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

    // cleanup on unmount
    useEffect(() => {
        return () => {
            Object.values(intervalsRef.current).forEach((id) => clearInterval(id));
            intervalsRef.current = {};
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
                swiper.slideTo(activeStepIndex, 600);
            }
        }
    }, [activeStepIndex]);
    
    // Handle slide change from Swiper
    const handleSlideChange = (swiper) => {
        setActiveStepIndex(swiper.activeIndex);
        if (typeof onActiveChange === 'function') {
            onActiveChange(swiper.activeIndex);
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
    useEffect(() => {
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
            swiperRef.current.swiper.slideTo(index, 600);
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