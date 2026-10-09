import { useEffect, useMemo, useRef, useState } from "react";
import { FiActivity, FiCheck, FiMoon, FiPause, FiPlay, FiRotateCcw, FiTrash2, FiWind } from "react-icons/fi";
import ConfirmDialog from "../confirmDialog";
import styles from "./styles.module.css";

const storageKey = "quiet-hours-sessions";
const durationOptions = [3, 5, 10, 15, 20];
const breathStyles = {
    "Easy breathing": [
        { label: "Breathe in", seconds: 4, mode: "inhale" },
        { label: "Breathe out", seconds: 6, mode: "exhale" },
    ],
    "Box breathing": [
        { label: "Breathe in", seconds: 4, mode: "inhale" },
        { label: "Hold gently", seconds: 4, mode: "hold" },
        { label: "Breathe out", seconds: 4, mode: "exhale" },
        { label: "Rest softly", seconds: 4, mode: "hold" },
    ],
};

const dateKey = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const shiftDate = (value, offset) => { const date = new Date(value + "T12:00:00"); date.setDate(date.getDate() + offset); return dateKey(date); };
const formatDay = (value, options = { weekday: "short" }) => new Intl.DateTimeFormat("en", options).format(new Date(value + "T12:00:00"));
const readSessions = () => { try { const saved = localStorage.getItem(storageKey); return saved ? JSON.parse(saved) : []; } catch { return []; } };
const id = () => globalThis.crypto?.randomUUID?.() ?? String(Date.now());
const formatClock = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
const phaseFor = (seconds, duration, name) => {
    const phases = breathStyles[name];
    const cycleLength = phases.reduce((sum, phase) => sum + phase.seconds, 0);
    const elapsed = duration * 60 - seconds;
    let position = elapsed % cycleLength;
    return phases.find((phase) => {
        position -= phase.seconds;
        return position < 0;
    }) ?? phases[0];
};

const MeditationTimer = () => {
    const [duration, setDuration] = useState(5);
    const [remaining, setRemaining] = useState(300);
    const remainingRef = useRef(300);
    const [breathStyle, setBreathStyle] = useState("Easy breathing");
    const [isRunning, setIsRunning] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [sessions, setSessions] = useState(readSessions);
    const [pendingDelete, setPendingDelete] = useState(null);

    useEffect(() => localStorage.setItem(storageKey, JSON.stringify(sessions)), [sessions]);
    useEffect(() => {
        if (!isRunning) return undefined;
        const interval = window.setInterval(() => {
            const next = Math.max(0, remainingRef.current - 1);
            remainingRef.current = next;
            setRemaining(next);
            if (next === 0) {
                const finishedAt = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date());
                setIsRunning(false);
                setIsComplete(true);
                setSessions((current) => [{ id: id(), date: dateKey(new Date()), minutes: duration, finishedAt, breathStyle }, ...current]);
            }
        }, 1000);
        return () => window.clearInterval(interval);
    }, [isRunning, duration, breathStyle]);

    const today = dateKey(new Date());
    const week = Array.from({ length: 7 }, (_, index) => {
        const date = shiftDate(today, index - 6);
        return { date, label: formatDay(date), minutes: sessions.filter((session) => session.date === date).reduce((sum, session) => sum + session.minutes, 0) };
    });
    const weekMinutes = week.reduce((sum, day) => sum + day.minutes, 0);
    const practicedDays = week.filter((day) => day.minutes > 0).length;
    const todayMinutes = sessions.filter((session) => session.date === today).reduce((sum, session) => sum + session.minutes, 0);
    const chartMax = Math.max(5, ...week.map((day) => day.minutes));
    const phase = useMemo(() => phaseFor(remaining, duration, breathStyle), [remaining, duration, breathStyle]);
    const progress = isComplete ? 1 : 1 - remaining / (duration * 60);

    const startOrResume = () => {
        if (isComplete || remaining === 0) { remainingRef.current = duration * 60; setRemaining(duration * 60); setIsComplete(false); }
        setIsRunning(true);
    };
    const reset = () => { remainingRef.current = duration * 60; setIsRunning(false); setIsComplete(false); setRemaining(duration * 60); };
    const selectDuration = (value) => { remainingRef.current = value * 60; setDuration(value); setRemaining(value * 60); setIsRunning(false); setIsComplete(false); };
    const removeSession = () => { setSessions((current) => current.filter((session) => session.id !== pendingDelete.id)); setPendingDelete(null); };
    const clearSessions = () => { setSessions([]); setPendingDelete(null); };

    return <div className={styles.meditationTimer}>
        <section className={styles.hero}>
            <div><p className={styles.kicker}><FiMoon aria-hidden="true" /> A QUIETER MOMENT, WHENEVER YOU NEED IT</p><h1>Find a little<br /><span>stillness here.</span></h1><p className={styles.heroText}>Nothing to catch up on. Just a few minutes to come back to yourself.</p></div>
            <div className={styles.heroOrbit} aria-hidden="true"><i /><i /><i /><span>soften<br />the edges</span></div>
        </section>

        <div className={styles.dashboard}>
            <section className={styles.sessionCard} id="session" aria-labelledby="session-title">
                <div className={styles.sessionTop}><div><span className={styles.eyebrow}>YOUR PRACTICE</span><h2 id="session-title">A moment to arrive</h2></div><span className={styles.privateBadge}><FiCheck aria-hidden="true" /> PRIVATE BY DESIGN</span></div>
                <div className={styles.timerStage}>
                    <span className={`${styles.star} ${styles.starOne}`} aria-hidden="true">✦</span><span className={`${styles.star} ${styles.starTwo}`} aria-hidden="true">✧</span>
                    <div className={`${styles.timerRing} ${isRunning ? styles.ringActive : ""}`} style={{ "--ring-progress": `${progress * 100}%` }}>
                        <svg viewBox="0 0 160 160" aria-hidden="true"><circle className={styles.ringTrack} cx="80" cy="80" r="70" /><circle className={styles.ringProgress} cx="80" cy="80" r="70" style={{ strokeDashoffset: `${440 * (1 - progress)}` }} /></svg>
                        <div className={`${styles.breathOrb} ${isRunning ? styles[phase.mode] : ""}`}><span className={styles.timerCaption}>{isComplete ? "SESSION COMPLETE" : isRunning ? phase.label.toUpperCase() : "YOUR QUIET MINUTES"}</span><strong>{formatClock(remaining)}</strong><small>{isComplete ? "well done" : "minutes · seconds"}</small></div>
                    </div>
                    <p className={styles.breathHint}>{isComplete ? "You made time for yourself. Let that be enough." : isRunning ? "Let your breath follow the gentle rhythm." : "Settle in. The next breath can wait."}</p>
                </div>
                <div className={styles.durationPicker}><span>SESSION LENGTH</span><div>{durationOptions.map((minutes) => <button key={minutes} type="button" disabled={isRunning} aria-pressed={duration === minutes} className={duration === minutes ? styles.selectedDuration : ""} onClick={() => selectDuration(minutes)}>{minutes}<small>min</small></button>)}</div></div>
                <div className={styles.sessionControls}><label className={styles.breathSelect}><FiWind aria-hidden="true" /><span>Breathing rhythm</span><select value={breathStyle} disabled={isRunning} onChange={(event) => setBreathStyle(event.target.value)}>{Object.keys(breathStyles).map((style) => <option key={style}>{style}</option>)}</select></label><div className={styles.actionButtons}><button className={styles.startButton} type="button" onClick={isRunning ? () => setIsRunning(false) : startOrResume}>{isRunning ? <FiPause aria-hidden="true" /> : <FiPlay aria-hidden="true" />}{isRunning ? "Pause" : isComplete ? "Begin again" : remaining < duration * 60 ? "Resume" : "Begin session"}</button><button className={styles.resetButton} type="button" aria-label="Reset timer" onClick={reset}><FiRotateCcw aria-hidden="true" /></button></div></div>
            </section>

            <aside className={styles.practiceCard} id="practice-log" aria-labelledby="practice-title">
                <div className={styles.practiceHeading}><span className={styles.activityIcon}><FiActivity aria-hidden="true" /></span><div><span className={styles.eyebrow}>A GENTLE CHECK-IN</span><h2 id="practice-title">Your practice</h2></div></div>
                <div className={styles.stats}><div><strong>{weekMinutes}<small> min</small></strong><span>THIS WEEK</span></div><i /><div><strong>{practicedDays}<small> / 7</small></strong><span>DAYS WITH A PAUSE</span></div></div>
                <div className={styles.weekChart} role="img" aria-label={`Meditation practice during the last seven days, ${weekMinutes} minutes total`}>
                    {week.map((day) => <div className={styles.dayBar} key={day.date}><span>{day.minutes ? day.minutes + "m" : ""}</span><i style={{ height: `${Math.max(day.minutes ? 8 : 0, day.minutes / chartMax * 100)}%` }} /><small>{day.label}</small></div>)}
                </div>
                <div className={styles.todayNote}><span>Today</span><strong>{todayMinutes} min</strong><small>{todayMinutes ? "A lovely bit of space." : "A fresh page, whenever you're ready."}</small></div>
                <div className={styles.historyHeading}><div><h3>Recent sessions</h3><span>Saved on this device</span></div>{sessions.length > 0 && <button type="button" onClick={() => setPendingDelete({ all: true })}>Clear all</button>}</div>
                <ul className={styles.sessionList}>{sessions.slice(0, 4).map((session) => <li key={session.id}><span className={styles.sessionDot}><FiCheck aria-hidden="true" /></span><div><strong>{session.minutes} minute pause</strong><small>{formatDay(session.date, { month: "short", day: "numeric" })} · {session.finishedAt}</small></div><button type="button" aria-label={`Remove ${session.minutes} minute session`} onClick={() => setPendingDelete(session)}><FiTrash2 aria-hidden="true" /></button></li>)}{sessions.length === 0 && <li className={styles.emptyHistory}><span className={styles.emptyMoon}>☾</span><p>Your practice will gather here, one pause at a time.</p></li>}</ul>
            </aside>
        </div>

        <section className={styles.guideSection} id="breathing-guide"><div className={styles.guideHeading}><span className={styles.eyebrow}>A SOFT PLACE TO START</span><h2>Let the breath be your anchor.</h2><p>No special technique needed. Follow the cue, and begin again whenever your mind wanders.</p></div><div className={styles.guideSteps}><article><span>01</span><FiWind aria-hidden="true" /><h3>Arrive</h3><p>Notice the support beneath you and allow your shoulders to soften.</p></article><article><span>02</span><FiActivity aria-hidden="true" /><h3>Follow</h3><p>Let the circle and gentle prompts guide an easy, unforced rhythm.</p></article><article><span>03</span><FiMoon aria-hidden="true" /><h3>Return</h3><p>When thoughts drift, meet them kindly and come back to one breath.</p></article></div></section>
        {pendingDelete && <ConfirmDialog title={pendingDelete.all ? "Clear your practice history?" : "Remove this session?"} description={pendingDelete.all ? "All completed sessions saved on this device will be removed." : `${pendingDelete.minutes} minutes of practice will be removed from your history.`} confirmLabel={pendingDelete.all ? "Clear history" : "Remove session"} onCancel={() => setPendingDelete(null)} onConfirm={pendingDelete.all ? clearSessions : removeSession} />}
    </div>;
};

export default MeditationTimer;
