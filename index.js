// index.js — TTS Escape Stop extension entry point.
//
// Makes the Escape key stop in-progress TTS playback (any provider, e.g. GSVI).
// It reuses SillyTavern's built-in TTS "stop" control (#ttsExtensionMenuItem),
// so both the audio element and the internal TTS job queues are fully reset —
// no stale queue state left behind that would kill future auto-TTS.

const MODULE_NAME = 'tts_escape_stop';

const defaultSettings = Object.freeze({
    enabled: true,
});

/**
 * Gets this extension's settings object, initializing it (and backfilling any
 * keys missing from an older saved version) if needed.
 */
function getSettings() {
    const { extensionSettings } = SillyTavern.getContext();

    if (!extensionSettings[MODULE_NAME]) {
        extensionSettings[MODULE_NAME] = structuredClone(defaultSettings);
    }

    for (const key of Object.keys(defaultSettings)) {
        if (!Object.hasOwn(extensionSettings[MODULE_NAME], key)) {
            extensionSettings[MODULE_NAME][key] = defaultSettings[key];
        }
    }

    return extensionSettings[MODULE_NAME];
}

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
    if (!getSettings().enabled) {
        return;
    }

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

/**
 * Renders the settings panel (settings.html) and wires its inputs to the
 * extension's settings. Idempotent — safe to call multiple times.
 */
async function addSettingsUI() {
    const { renderExtensionTemplateAsync, saveSettingsDebounced } = SillyTavern.getContext();
    const settings = getSettings();

    if ($('#tts_escape_stop_settings').length > 0) {
        return;
    }

    // First argument must match this extension's folder name under
    // scripts/extensions/third-party/.
    const html = await renderExtensionTemplateAsync('third-party/tts-esc-stop', 'settings', settings);
    $('#extensions_settings2').append(html);

    $('#tts_escape_stop_enabled')
        .prop('checked', settings.enabled)
        .on('change', function () {
            settings.enabled = $(this).prop('checked');
            saveSettingsDebounced();
        });
}

async function setup() {
    getSettings();
    await addSettingsUI();
    attachKeydownListener();
}

// --- Lifecycle hooks (declared in manifest.json's "hooks" object) ---

export async function onActivate() {
    // Fires during page load when the extension is enabled.
    await setup();
    console.log(`[${MODULE_NAME}] Extension loaded.`);
}

export async function onEnable() {
    // Mid-session enable from Manage Extensions (module was not loaded at startup).
    await setup();
}

export function onDisable() {
    detachKeydownListener();
    $('#tts_escape_stop_settings').remove();
}
