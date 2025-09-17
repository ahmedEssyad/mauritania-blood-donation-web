# Notification Sounds

This directory contains audio files for PWA notifications:

- `urgent.mp3` - Emergency blood request notifications
- `normal.mp3` - Regular blood request notifications
- `success.mp3` - Donation confirmation notifications

## Format Requirements
- Format: MP3
- Duration: 1-3 seconds
- Sample Rate: 44.1kHz
- Bitrate: 128kbps or higher

## Usage
These sounds are played when push notifications are received:

```javascript
// Play urgent notification sound
const audio = new Audio('/sounds/urgent.mp3');
audio.play().catch(console.error);
```