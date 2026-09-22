// index.js — TTS Escape Stop extension entry point.
//
// Makes the Escape key stop in-progress TTS playback (any provider, e.g. GSVI).
// It reuses SillyTavern's built-in TTS "stop" control (#ttsExtensionMenuItem),
// so both the audio element and the internal TTS job queues are fully reset —
// no stale queue state left behind that would kill future auto-TTS.
//
// This extension has no settings of its own: it does exactly one thing, and
// users who don't want it can disable the whole extension in Manage Extensions.

const MODULE_NAME = 'tts_esc_stop';

/**
 * Escape handler. Only acts when TTS is actually playing or processing. When
 * TTS is idle it does nothing — clicking the TTS control while idle would start
 * narrating the last message, which we must not do.
 *
 * "Active" is detected two ways:
 *  - The TTS extension's state indicator shows the stop icon (covers both
 *    playback and in-progress generation; note this icon only refreshes on a
 *    ~1s interval).
 *  - The shared TTS audio element (#tts_audio) is not paused — real-time check
 *    for audible playback, so Escape works within milliseconds of speech
 *    starting even before the icon has refreshed.
 */
function onEscapeKeyDown(event) {
    // Ignore key auto-repeat and IME composition (e.g. Japanese input).
    if (event.key !== 'Escape' || event.repeat || event.isComposing) {
        return;
    }

    // SillyTavern's native Escape handler owns the key while a message editor
    // is open — don't fight it for that case.
    if ($('#curEditTextarea').is(':visible') || $('.reasoning_edit_textarea').length > 0) {
        return;
    }

    const indicator = document.getElementById('tts_media_control');
    const ttsAudio = document.getElementById('tts_audio');
    const ttsActive = (indicator && indicator.classList.contains('fa-stop-circle')) || (ttsAudio && !ttsAudio.paused);

    if (!ttsActive) {
        return; // TTS idle — nothing to stop.
    }

    const stopControl = document.getElementById('ttsExtensionMenuItem');
    if (!stopControl) {
        console.warn(`[${MODULE_NAME}] TTS playback control not found (is the built-in TTS extension enabled?)`);
        return;
    }

    // Triggering the built-in control runs SillyTavern's full reset: stops the
    // audio element and clears both TTS job queues.
    $(stopControl).trigger('click');
}

let keydownListenerAttached = false;

function attachKeydownListener() {
    if (keydownListenerAttached) {
        return;
    }
    document.addEventListener('keydown', onEscapeKeyDown);
    keydownListenerAttached = true;
}

function detachKeydownListener() {
    if (!keydownListenerAttached) {
        return;
    }
    document.removeEventListener('keydown', onEscapeKeyDown);
    keydownListenerAttached = false;
}

// --- Lifecycle hooks (declared in manifest.json's "hooks" object) ---

export async function onActivate() {
    // Fires during page load when the extension is enabled.
    attachKeydownListener();
    console.log(`[${MODULE_NAME}] Extension loaded.`);
}

export async function onEnable() {
    // Mid-session enable from Manage Extensions (module was not loaded at startup).
    attachKeydownListener();
}

export function onDisable() {
    detachKeydownListener();
}
