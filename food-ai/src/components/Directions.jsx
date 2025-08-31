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
    // timers state (seconds remaining) keyed by slide index
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
    // Accepts numbers (minutes), strings like '5', '5 mins', '1:30', or '90s'.
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

    const clearTimer = useCallback((index) => {
        const id = intervalsRef.current[index];
        if (id) {
            clearInterval(id);
            delete intervalsRef.current[index];
        }
    }, []);

    const startTimer = useCallback((index, initialSeconds) => {
        if (!initialSeconds || initialSeconds <= 0) return;
        clearTimer(index);
        setTimers((prev) => ({ ...prev, [index]: initialSeconds }));
        intervalsRef.current[index] = setInterval(() => {
            setTimers((prev) => {
                const cur = prev[index] ?? 0;
                if (cur <= 1) {
                    // reach zero, stop interval and set 0
                    clearTimer(index);
                    // mark 0 and allow playing alarm below via effect
                    return { ...prev, [index]: 0 };
                }
                return { ...prev, [index]: cur - 1 };
            });
        }, 1000);
    }, [clearTimer]);

    // restart the timer (reset to initial and start)
    const restartTimer = useCallback((index, initialSeconds) => {
        clearTimer(index);
        startTimer(index, initialSeconds);
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
        // check current active step timer
        const remaining = timers[activeStepIndex];
        if (remaining === 0) {
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
                        eventsTarget: 'body'
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
                                            href={`#step-${index + 1}`}
                                            className="step-link text-lg"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                goToStep(index);
                                            }}
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
                                            {step.text}
                                            {step.heat && (
                                                <span className={`heat-${step.heat}${isDisabled ? ' disabled-step' : ''}${(isActive && shimmerTrigger === index) ? ' shimmer' : ''}`}>
                                                    {step.heat} heat.
                                                </span>
                                            )}
                                            {step.time && (
                                                <>
                                                    {step.text && !step.text.endsWith('.') ? ',' : ''} about <span className="time-wrapper">
                                                        <span
                                                            className={`time timer${isDisabled ? ' disabled-step' : ''}`}
                                                            onClick={() => {
                                                                if (!isActive) return;
                                                                const initial = parseTimeToSeconds(step.time);
                                                                if (!initial) return;
                                                                const cur = timers[index] != null && Number.isFinite(Number(timers[index])) ? timers[index] : null;
                                                                // If timer is at 0, clicking stops the alarm
                                                                if (cur === 0) {
                                                                    if (alarmRef.current) {
                                                                        try { alarmRef.current.pause(); alarmRef.current.currentTime = 0; } catch (e) {}
                                                                    }
                                                                    // clear played flag so it can replay again if restarted
                                                                    delete alarmPlayedRef.current[index];
                                                                    return;
                                                                }
                                                                // If running, pause
                                                                if (intervalsRef.current[index]) {
                                                                    // pause: clear interval but keep remaining time
                                                                    clearTimer(index);
                                                                    // paused
                                                                    return;
                                                                }
                                                                // if not running, resume from remaining or initial
                                                                const startFrom = (timers[index] != null && Number.isFinite(Number(timers[index]))) ? timers[index] : initial;
                                                                startTimer(index, startFrom);
                                                            }}
                                                            onDoubleClick={() => {
                                                                if (!isActive) return;
                                                                const initial = parseTimeToSeconds(step.time);
                                                                if (!initial) return;
                                                                restartTimer(index, initial);
                                                            }}
                                                        >
                                                            {formatTime((timers[index] != null && Number.isFinite(Number(timers[index]))) ? timers[index] : parseTimeToSeconds(step.time))}
                                                        </span>
                                                        <span className="minutes-text">minutes</span>
                                                    </span>.
                                                </>
                                            )}
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