import React, { useState, useEffect, useCallback } from 'react';
import logoUrl from '../../logo.png';
import { suggestTags } from './services/geminiService';
import type { Note } from './types';

declare const webviewApi: {
    postMessage: (message: any) => Promise<any>;
    onMessage: (handler: (message: any) => void) => (() => void) | void;
};

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 0 1 9.75 22.5a.75.75 0 0 1-.75-.75v-7.19c-1.754.266-3.536.25-5.284 0-.19-.009-.376-.023-.562-.042a.75.75 0 0 1 .69-1.42c.861.104 1.73.187 2.61.246V9.08c0-2.158.845-4.148 2.368-5.668.25-.248.514-.486.79-.711ZM12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" clipRule="evenodd" />
        <path d="M11.024 1.903a.75.75 0 0 1 1.056 0l1.03 1.06a.75.75 0 0 0 .53.22h1.485a.75.75 0 0 1 .53.22l.28.28a.75.75 0 0 1 0 1.056l-1.06 1.03a.75.75 0 0 0-.22.53v1.485a.75.75 0 0 1-.22.53l-.28.28a.75.75 0 0 1-1.056 0l-1.03-1.06a.75.75 0 0 0-.53-.22H9.25a.75.75 0 0 1-.53-.22l-.28-.28a.75.75 0 0 1 0-1.056l1.06-1.03a.75.75 0 0 0 .22-.53V3.25a.75.75 0 0 1 .22-.53l.28-.28Z" />
    </svg>
);

const TagIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M3.25 4A2.25 2.25 0 0 0 1 6.25v7.5A2.25 2.25 0 0 0 3.25 16h7.5A2.25 2.25 0 0 0 13 13.75v-7.5A2.25 2.25 0 0 0 10.75 4h-7.5ZM14.25 9a.75.75 0 0 0 0 1.5h1.25a.75.75 0 0 0 0-1.5h-1.25Zm0 2.5a.75.75 0 0 0 0 1.5h2.25a.75.75 0 0 0 0-1.5h-2.25Z" />
    </svg>
);

const LoaderIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={className}>
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3a9 9 0 1 0 9 9"></path>
    </svg>
);

export default function App() {
    const [currentNote, setCurrentNote] = useState<Note | null>(null);
    const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('[AI Tag Suggester] Webview App mounted');
        // No need to fetch API keys in the webview anymore; the backend will
        // select provider (Gemini/HF) and validate credentials.

        const handleMessage = (message: any) => {
            // Some environments wrap payloads like { message: {...} }
            const payload = (message && message.name) ? message : (message && message.message) ? message.message : message;
            console.log('[AI Tag Suggester] onMessage raw:', message);
            console.log('[AI Tag Suggester] onMessage payload:', payload);
            if (payload && payload.name === 'theme') {
                try {
                    const v = payload.value;
                    let isDark = false;
                    if (typeof v === 'string') {
                        isDark = v.toLowerCase().includes('dark');
                    } else if (typeof v === 'number') {
                        // Heuristic: Joplin dark themes are typically non-zero (>1)
                        isDark = v >= 2; // covers Dark & Solarized Dark
                    }
                    const html = document.documentElement;
                    html.setAttribute('data-theme', isDark ? 'dark' : 'light');
                    console.log('[AI Tag Suggester] Applied theme from host:', { value: v, isDark });
                } catch {}
            }
            if (payload && payload.name === 'noteDataUpdate') {
                console.log('[AI Tag Suggester] noteDataUpdate received', payload?.note ? { id: payload.note.id, title: payload.note.title, tags: payload.note.tags } : null);
                setCurrentNote(payload.note);
                // Reset UI state when a new note is selected
                setSuggestedTags([]);
                setSelectedTags([]);
                setError(null);
            }
        };

        // Register Joplin webview message handler
        const unsubscribe = webviewApi.onMessage(handleMessage);
        // Now that the listener is in place, notify main plugin we are ready
        webviewApi?.postMessage?.({ name: 'webviewReady' });
        // Fallback: explicitly request current note in case initial push was missed
        webviewApi?.postMessage?.({ name: 'requestCurrentNote' });
        return () => {
            try { if (typeof unsubscribe === 'function') unsubscribe(); } catch {}
        };
    }, []);

    const handleSuggestTags = useCallback(async () => {
        if (!currentNote || !currentNote.content) {
            console.log('[AI Tag Suggester] suggestTags -> blocked: no currentNote/content');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuggestedTags([]);
        setSelectedTags([]);
        try {
            console.log('[AI Tag Suggester] suggestTags -> sending to main');
            // The second parameter is unused; main plugin validates keys.
            const tags = await suggestTags(currentNote.content, '');
            console.log('[AI Tag Suggester] suggestTags <- received', tags);
            setSuggestedTags(tags);
        } catch (err: unknown) {
            if (err instanceof Error) {
                 setError(err.message);
            } else {
                 setError("An unknown error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [currentNote]);

    const handleTagSelectionToggle = (tag: string) => {
        setSelectedTags(prev => {
            const next = prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag];
            console.log('[AI Tag Suggester] selection toggled ->', next);
            return next;
        });
    };

    const handleApplyTags = () => {
        if (!currentNote) return;
        console.log('[AI Tag Suggester] applyTags -> sending', { noteId: currentNote.id, selectedTags });
        webviewApi.postMessage({
            name: 'applyTags',
            noteId: currentNote.id,
            tags: selectedTags
        });
        setSuggestedTags([]);
        setSelectedTags([]);
    };

    const MainContent = () => {
        if (!currentNote) {
            return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                    <p style={{ color: '#6b7280' }}>Select a note in Joplin to begin.</p>
                </div>
            );
        }

        return (
            <div style={{ background: 'var(--card-bg)', padding: 12, borderRadius: 10, border: '1px solid var(--border)', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <div style={{ marginBottom: 12 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: 0, marginBottom: 6 }}>{currentNote.title}</h2>
                    <h3 style={{ fontWeight: 600, color: 'var(--muted)', margin: 0, marginBottom: 6 }}>Current Tags</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {currentNote.tags.length > 0 ? currentNote.tags.map(tag => (
                            <span key={tag} style={{ background: 'var(--chip-bg)', color: 'var(--chip-text)', fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 9999 }}>{tag}</span>
                        )) : <p style={{ fontSize: 13, color: '#94a3b8' }}>No tags yet.</p>}
                    </div>
                </div>

                <button
                    onClick={handleSuggestTags}
                    disabled={isLoading || !currentNote.content}
                    className="btn-reset"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: isLoading ? 'var(--btn-disabled)' : 'var(--primary)', color: 'var(--btn-text)', fontWeight: 600, padding: '10px 12px', border: 0, borderRadius: 8, cursor: isLoading ? 'not-allowed' : 'pointer', minHeight: 0, height: 40, lineHeight: 'normal' }}
                >
                    {isLoading ? (
                        <>
                            <LoaderIcon className="w-5 h-5 animate-spin"/>
                            <span>Analyzing...</span>
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-5 h-5"/>
                            <span>Suggest Tags</span>
                        </>
                    )}
                </button>

                {error && <p style={{ fontSize: 13, color: 'var(--danger)', marginTop: 12, textAlign: 'center' }}>{error}</p>}
                
                {suggestedTags.length > 0 && (
                    <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                        <h3 style={{ fontWeight: 600, color: 'var(--muted)', marginTop: 0, marginBottom: 8 }}>AI Suggestions</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {suggestedTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => handleTagSelectionToggle(tag)}
                                    className="btn-reset"
                                    style={{ fontSize: 13, fontWeight: 500, padding: '6px 10px', borderRadius: 9999, border: '1px solid', borderColor: selectedTags.includes(tag) ? 'var(--primary)' : 'var(--border)', background: selectedTags.includes(tag) ? 'var(--primary)' : 'var(--card-bg)', color: selectedTags.includes(tag) ? 'var(--btn-text)' : 'var(--text)', cursor: 'pointer', minHeight: 0, height: 'auto', lineHeight: 'normal' }}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleApplyTags}
                            disabled={selectedTags.length === 0}
                            className="btn-reset"
                            style={{ width: '100%', marginTop: 12, background: selectedTags.length === 0 ? 'var(--btn-disabled)' : 'var(--secondary)', color: 'var(--btn-text)', fontWeight: 600, padding: '10px 12px', border: 0, borderRadius: 8, cursor: selectedTags.length === 0 ? 'not-allowed' : 'pointer', minHeight: 0, height: 40, lineHeight: 'normal' }}
                        >
                            Apply {selectedTags.length > 0 ? `${selectedTags.length} ` : ''}Tag{selectedTags.length !== 1 ? 's' : ''}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div id="ai-panel" style={{ fontFamily: '-apple-system, Segoe UI, Roboto, sans-serif', width: '100%', maxWidth: '100%', textAlign: 'left', margin: 0, background: 'var(--bg)', position: 'relative', isolation: 'isolate', overflow: 'hidden' }}>
            <style>{`
                /* HARD RESET to block host-injected decorative art */
                #ai-panel, #ai-panel * {
                    background-image: none !important;
                }
                #ai-panel::before, #ai-panel::after,
                #ai-panel *::before, #ai-panel *::after {
                    content: none !important;
                    background: none !important;
                    background-image: none !important;
                }
                /* Prevent any accidental gigantic media */
                #ai-panel svg {
                    width: 20px !important;
                    height: 20px !important;
                }
                #ai-panel img, #ai-panel svg, #ai-panel canvas, #ai-panel video {
                    max-width: 100% !important;
                    max-height: 100% !important;
                }
                #ai-panel * {
                    overflow: visible;
                }
                #ai-panel .card, #ai-panel [data-card], #ai-panel .panel {
                    overflow: hidden;
                }
                /* Default to DARK look to blend with most Joplin setups */
                :root {
                    --bg: #0b1220;
                    --text: #e5e7eb;
                    --muted: #a3a3a3;
                    --card-bg: #0f172a;
                    --border: #273043;
                    --chip-bg: #1f2937;
                    --chip-text: #e5e7eb;
                    --primary: #22c55e;
                    --secondary: #334155;
                    --btn-text: #ffffff;
                    --btn-disabled: #475569;
                    --danger: #f87171;
                }
                /* Explicit overrides when main plugin provides theme */
                :root[data-theme="dark"] {
                    --bg: #0b1220;
                    --text: #e5e7eb;
                    --muted: #a3a3a3;
                    --card-bg: #0f172a;
                    --border: #273043;
                    --chip-bg: #1f2937;
                    --chip-text: #e5e7eb;
                    --primary: #22c55e;
                    --secondary: #334155;
                    --btn-text: #ffffff;
                    --btn-disabled: #475569;
                    --danger: #f87171;
                }
                :root[data-theme="light"] {
                    --bg: #ffffff;
                    --text: #0f172a;
                    --muted: #475569;
                    --card-bg: #ffffff;
                    --border: #e5e7eb;
                    --chip-bg: #e5e7eb;
                    --chip-text: #374151;
                    --primary: #0ea5e9;
                    --secondary: #111827;
                    --btn-text: #ffffff;
                    --btn-disabled: #cbd5e1;
                    --danger: #ef4444;
                }
                @media (prefers-color-scheme: light) {
                    :root {
                        --bg: #ffffff;
                        --text: #0f172a;
                        --muted: #475569;
                        --card-bg: #ffffff;
                        --border: #e5e7eb;
                        --chip-bg: #e5e7eb;
                        --chip-text: #374151;
                        --primary: #0ea5e9;
                        --secondary: #111827;
                        --btn-text: #ffffff;
                        --btn-disabled: #cbd5e1;
                        --danger: #ef4444;
                    }
                }
                /* Reset weird host styles on buttons */
                .btn-reset {
                    background-image: none !important;
                    box-shadow: none !important;
                    min-height: 0 !important;
                }
            `}</style>
            <div style={{ maxWidth: 820, margin: '8px auto 0 auto', padding: '0 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0 8px 0' }}>
                    <img src={logoUrl} alt="" style={{ display: 'block', width: 18, height: 18, borderRadius: 4, objectFit: 'contain' }} />
                    <h1 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>AI Tag Suggester</h1>
                    <div style={{ marginLeft: 'auto' }}>
                        <button
                            onClick={() => webviewApi.postMessage({ name: 'requestCurrentNote' })}
                            className="btn-reset"
                            style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', cursor: 'pointer', minHeight: 0, height: 28, lineHeight: 'normal' }}
                        >
                            Refresh
                        </button>
                    </div>
                </div>
                <div style={{ width: '100%' }}>
                    <MainContent />
                </div>
            </div>
        </div>
    );
}
