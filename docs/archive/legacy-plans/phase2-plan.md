# Phase 2 Plan - Voice Core

## Objective
Thiết lập luồng hội thoại tiếng Việt hai chiều với Mia, gồm STT, chat, TTS, session persistence, và memory foundations.

## Inputs / Prerequisites
- Phase 1 complete
- Google Cloud credentials validated
- Session and child data primitives available

## Build Items
- Implement `POST /api/stt`
- Implement `POST /api/chat`
- Implement `POST /api/tts`
- Build `useVoicePipeline`
- Persist messages and session state
- Add async memory extraction and retrieval via pgvector
- Add retries, fallback copy, and session stability handling

## Acceptance Checks
- Child speech becomes transcript reliably in Vietnamese
- Mia responds in Vietnamese with acceptable latency
- Audio playback starts fast enough to feel conversational
- Session transcript persists correctly
- Long-term memory can be recalled across sessions

## Risk Watchouts
- Latency drift above 2 seconds
- STT confidence variability across accents
- TTS streaming complexity in browser audio playback
