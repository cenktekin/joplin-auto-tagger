import { SettingItemType } from 'api/types';
import { GoogleGenAI, Type } from '@google/genai';
import { request as gaxiosRequest } from 'gaxios';
import * as fs from 'fs';
import * as path from 'path';

// The Joplin API object is provided as a global, so we declare it here
// to make TypeScript aware of it.
declare const joplin: any;

interface Tag {
    id: string;
    title: string;
}

async function pushThemeToPanel() {
    try {
        // Joplin stores theme as a numeric id or string depending on version
        const theme = await joplin.settings.globalValue('theme');
        currentTheme = theme;
        await joplin.views.panels.postMessage(panel, { name: 'theme', value: theme });
        console.info('[AI Tag Suggester] Pushed theme to webview:', theme);
    } catch (e) {
        console.warn('[AI Tag Suggester] Unable to read/push theme, will rely on webview defaults');
    }
}

let panel: string;
let panelReady = false;
let currentTheme: any = null;

// Fetches the full data for the currently selected note and sends it to the panel
async function updatePanelWithCurrentNote() {
    const currentNote = await joplin.workspace.selectedNote();
    if (!currentNote) {
        // Do NOT overwrite the webview HTML; inform the webview instead
        console.info('[AI Tag Suggester] posting noteDataUpdate: null (no note selected)');
        joplin.views.panels.postMessage(panel, {
            name: 'noteDataUpdate',
            note: null,
        });

        // Normalize legacy provider values (e.g., previously saved 'huggingface')
        try {
            const savedProvRaw = await joplin.settings.value('provider');
            const savedProv = (savedProvRaw || '').toString().toLowerCase();
            if (!['gemini', 'openrouter'].includes(savedProv)) {
                await joplin.settings.setValue('provider', 'gemini');
                console.info('[AI Tag Suggester] Migrated legacy provider value to gemini');
            }
        } catch (e) {
            console.warn('[AI Tag Suggester] Unable to normalize provider setting. Using defaults.');
        }

        return;
    }

    // Fetch note tags
    const noteTags = await joplin.data.get(['notes', currentNote.id, 'tags'], { fields: ['id', 'title'] });
    const tagTitles = noteTags.items.map((tag: Tag) => tag.title);

    const noteData = {
        id: currentNote.id,
        title: currentNote.title,
        content: currentNote.body,
        tags: tagTitles,
    };
    
    // Post the note data to the webview
    console.info('[AI Tag Suggester] posting noteDataUpdate:', {
        id: currentNote.id,
        title: currentNote.title,
        tags: tagTitles,
    });
    joplin.views.panels.postMessage(panel, {
        name: 'noteDataUpdate',
        note: noteData
    });
}

// Applies an array of tag titles to a specific note
async function applyTagsToNote(noteId: string, tags: string[]) {
    if (!noteId || !tags) return;
    // Normalize input tags
    const normalized = Array.from(new Set(
        tags
            .map(t => (t ?? '').toString().trim().toLowerCase())
            .filter(t => t.length > 0)
    ));
    console.info('[AI Tag Suggester] applyTagsToNote(normalized):', normalized);
    if (normalized.length === 0) {
        console.warn('[AI Tag Suggester] No valid tags to apply. Aborting.');
        return;
    }

    // Find existing tags by exact title (case-insensitive), otherwise create
    const tagIds = await Promise.all(normalized.map(async (tagTitle) => {
        const search = await joplin.data.get(['tags'], { query: tagTitle, fields: ['id', 'title'] });
        const exact = (search.items || []).find((it: Tag) => (it.title || '').toLowerCase() === tagTitle);
        if (exact) {
            console.info('[AI Tag Suggester] Found existing tag id for', tagTitle, '->', exact.id);
            return exact.id;
        }
        const created = await joplin.data.post(['tags'], null, { title: tagTitle });
        console.info('[AI Tag Suggester] Created tag', tagTitle, '->', created.id);
        return created.id;
    }));

    // Associate each tag with the note
    await Promise.all(tagIds.map(tagId => {
        console.info('[AI Tag Suggester] Linking tag to note:', { tagId, noteId });
        return joplin.data.post(['tags', tagId, 'notes'], null, { id: noteId });
    }));

    // Refresh the panel with updated tags
    await updatePanelWithCurrentNote();
}

joplin.plugins.register({
    onStart: async function() {
        console.info('AI Tag Suggester plugin initializing...');

        try {
            await joplin.settings.registerSection('aiTagSuggesterSection', {
                label: 'AI Tag Suggester',
                iconName: 'fas fa-tags',
            });
            console.info('[AI Tag Suggester] Settings section registered');
        } catch (error) {
            console.error('[AI Tag Suggester] Failed to register settings section:', error);
        }

        await joplin.settings.registerSettings({
            geminiApiKey: {
                value: '',
                type: SettingItemType.String,
                section: 'aiTagSuggesterSection',
                public: true,
                label: 'Google Gemini API Key',
                description: 'Your API key for the Google Gemini API.',
            },
            provider: {
                value: 'gemini',
                type: SettingItemType.String,
                section: 'aiTagSuggesterSection',
                public: true,
                label: 'Provider (gemini | openrouter)',
                description: 'Select which provider to use for tag suggestions. Enter "gemini" or "openrouter".',
            },
            openrouterApiKey: {
                value: '',
                type: SettingItemType.String,
                section: 'aiTagSuggesterSection',
                public: true,
                secure: true,
                label: 'OpenRouter API Key',
                description: 'Your API key for https://openrouter.ai (Header: Authorization: Bearer <key>).',
            },
            openrouterModel: {
                value: 'openrouter/auto',
                type: SettingItemType.String,
                section: 'aiTagSuggesterSection',
                public: true,
                label: 'OpenRouter Model',
                description: 'e.g., openrouter/auto or meta-llama/Meta-Llama-3.1-8B-Instruct',
            },
            outputLanguage: {
                value: 'English',
                type: SettingItemType.String,
                section: 'aiTagSuggesterSection',
                public: true,
                label: 'Output Language',
                description: 'Language for generated tags (e.g., English, Traditional Chinese, Turkish).',
            },
        });
        console.info('[AI Tag Suggester] Settings registered successfully');

        panel = await joplin.views.panels.create('ai_tag_suggester_panel');
        console.info('[AI Tag Suggester] Panel created:', panel);

        // Register message handler BEFORE loading the webview so early messages are received
        joplin.views.panels.onMessage(panel, async (message) => {
            console.info('[AI Tag Suggester] onMessage received:', message?.name);
            if (message.name === 'webviewReady') {
                panelReady = true;
                console.info('[AI Tag Suggester] webviewReady received; updating panel with current note');
                await updatePanelWithCurrentNote();
                await pushThemeToPanel();
                return;
            }
            if (message.name === 'getApiKey') {
                console.info('[AI Tag Suggester] getApiKey requested');
                return joplin.settings.value('geminiApiKey');
            }
            if (message.name === 'applyTags') {
                console.info('[AI Tag Suggester] applyTags for note', message?.noteId, message?.tags);
                await applyTagsToNote(message.noteId, message.tags);
                return;
            }
            if (message.name === 'requestCurrentNote') {
                console.info('[AI Tag Suggester] requestCurrentNote received');
                await updatePanelWithCurrentNote();
                return;
            }
            if (message.name === 'ping') {
                console.info('[AI Tag Suggester] ping received -> responding pong');
                return { name: 'pong' };
            }
            if (message.name === 'suggestTags') {
                console.info('[AI Tag Suggester] suggestTags invoked');
                const provider = (await joplin.settings.value('provider')) || 'gemini';
                const geminiApiKey = await joplin.settings.value('geminiApiKey');
                const openrouterApiKey = await joplin.settings.value('openrouterApiKey');
                const openrouterModel = (await joplin.settings.value('openrouterModel')) || 'openrouter/auto';
                const outputLanguage = (await joplin.settings.value('outputLanguage')) || 'English';

                const prompt = `You are an expert at analyzing text and extracting key topics to be used as tags.\nAnalyze the following note content. Based on your analysis, generate exactly 5 relevant and concise tags in ${outputLanguage}.\nEach tag should be 1-3 words long and use lowercase letters, with hyphens instead of spaces (e.g., 'project-management').\nReturn your response as a JSON object with the shape { \"tags\": string[] } and nothing else.\n\nNote Content:\n---\n${message.noteContent}\n---`;

                // OpenRouter path (if selected or Gemini key missing but OpenRouter key present)
                const useOpenRouter = provider === 'openrouter' || (!geminiApiKey && !!openrouterApiKey);
                if (useOpenRouter) {
                    if (!openrouterApiKey) return { error: 'OpenRouter API key missing' };
                    try {
                        console.info(`[AI Tag Suggester] OpenRouter provider selected. Model: ${openrouterModel}`);
                        const resp = await gaxiosRequest<any>({
                            url: 'https://openrouter.ai/api/v1/chat/completions',
                            method: 'POST',
                            headers: {
                                Authorization: `Bearer ${openrouterApiKey}`,
                                'Content-Type': 'application/json',
                                // Recommended by OpenRouter
                                'X-Title': 'Joplin AI Tag Suggester',
                            },
                            data: {
                                model: openrouterModel,
                                messages: [
                                    { role: 'system', content: 'You output JSON only.' },
                                    { role: 'user', content: prompt },
                                ],
                                temperature: 0.2,
                                max_tokens: 200,
                            },
                            responseType: 'json',
                            timeout: 60000,
                        });
                        const data = resp.data;
                        const content = data?.choices?.[0]?.message?.content || '';
                        if (typeof content === 'string' && content.trim()) {
                            const jsonStart = content.indexOf('{');
                            const jsonEnd = content.lastIndexOf('}');
                            const jsonRaw = (jsonStart >= 0 && jsonEnd >= 0 && jsonEnd > jsonStart) ? content.slice(jsonStart, jsonEnd + 1) : content;
                            const parsed = JSON.parse(jsonRaw);
                            const tags = Array.isArray((parsed as any)?.tags) ? (parsed as any).tags : [];
                            if (tags.length > 0) return { tags };
                        }
                        return { error: 'OpenRouter returned no tags. Try another model or revise note content.' };
                    } catch (err: any) {
                        const msg = (err && (err.message || String(err))) || 'Unknown error';
                        console.error('[AI Tag Suggester] OpenRouter error:', msg);
                        return { error: `OpenRouter error: ${msg}` };
                    }
                }

                // Default to Gemini path
                if (!geminiApiKey) return { error: 'Gemini API key missing' };
                const tryModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
                const ai = new GoogleGenAI({ apiKey: geminiApiKey });
                for (const model of tryModels) {
                    try {
                        console.info(`[AI Tag Suggester] Calling Gemini model: ${model}`);
                        const response = await ai.models.generateContent({
                            model,
                            contents: prompt,
                            config: {
                                responseMimeType: 'application/json',
                                responseSchema: {
                                    type: Type.OBJECT,
                                    properties: {
                                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    },
                                    required: ['tags'],
                                },
                            },
                        });
                        const text = (response && typeof response.text === 'string') ? response.text : '';
                        const jsonString = text?.trim?.() || '';
                        const parsed = jsonString ? JSON.parse(jsonString) : {};
                        const tags = Array.isArray((parsed as any)?.tags) ? (parsed as any).tags : [];
                        if (tags.length > 0) return { tags };
                    } catch (err: any) {
                        const msg = (err && (err.message || String(err))) || 'Unknown error';
                        console.error(`[AI Tag Suggester] Gemini model ${model} failed:`, msg);
                    }
                }
                return { error: 'Failed to generate tags from Gemini.' };
            }
        });

        // Set a minimal HTML shell and inject the compiled script via addScript
        const shellHtml = `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <style>
                    /* Minimal reset to avoid Joplin styles leaking */
                    html, body { margin: 0 !important; padding: 0 !important; background: transparent !important; }
                    #root { isolation: isolate; background: transparent !important; }
                    .js-warning { font-family: sans-serif; color: #999; font-size: 12px; }
                </style>
            </head>
            <body style="background: transparent !important; margin: 0 !important; padding: 0 !important;">
                <div id="root" style="background: transparent !important; margin: 0 !important; padding: 0 !important;">
                    <span class="js-warning">If you see this, webview.js did not run yet…</span>
                </div>
            </body>
            </html>`;
        await joplin.views.panels.setHtml(panel, shellHtml);
        console.info('[AI Tag Suggester] Minimal HTML shell set');
        await joplin.views.panels.addScript(panel, 'webview.js');
        console.info('[AI Tag Suggester] webview.js injected via addScript');

        // Watch for theme changes and forward to webview
        try {
            joplin.settings.onChange(async (_event: any) => {
                await pushThemeToPanel();
            });
        } catch {}

        await joplin.commands.register({
            name: 'toggleTagSuggesterPanel',
            label: 'Toggle AI Tag Suggester',
            iconName: 'fas fa-tags',
            execute: async () => {
                const isVisible = await joplin.views.panels.visible(panel);
                await joplin.views.panels.show(panel, !isVisible);
            },
        });

        await joplin.views.menuItems.create('toggleTagSuggesterMenuItem', 'toggleTagSuggesterPanel', 'tools');

        // Listen for note selection changes and update the panel
        joplin.workspace.onNoteSelectionChange(async () => {
            if (!panelReady) return;
            await updatePanelWithCurrentNote();
        });

        // Also update when the plugin starts
        if (panelReady) {
            await updatePanelWithCurrentNote();
        }
    },
});