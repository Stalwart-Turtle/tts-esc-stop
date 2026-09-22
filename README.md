# TTS Escape Stop

A tiny SillyTavern UI extension: press **Escape** to stop in-progress TTS speech.

While the built-in TTS extension is speaking (or generating audio), pressing `Escape` cuts playback off instantly and clears the TTS queue, so the next message will speak normally. When TTS is idle, Escape does nothing — it never interferes with Escape's native job of canceling LLM generation.

Works with **any** TTS provider in SillyTavern (GSVI, OpenAI, Edge, ...). The extension never talks to a TTS server itself; it simply triggers SillyTavern's own built-in TTS stop control, which performs the full reset.

## Installation

1. Copy this folder into your SillyTavern install:
   ```
   public/scripts/extensions/third-party/tts-esc-stop/
   ```
2. Enable **TTS Escape Stop** in Settings → Manage Extensions and refresh the page.

The extension has no settings of its own — it does exactly one thing. If you don't want that, disable the extension in Manage Extensions.

## Notes

- The SillyTavern browser tab must have keyboard focus for the keypress to land.

*Vibe coded with Qwen 3.8 27B.*
