# Enchanted Grove

A cozy, scrapbook-inspired JavaScript task planner: plant study quests, share evidence when you finish, and let Gemini verify your progress so your forest friend can earn XP, level up, and collect accessories.

## Run locally

Requires Node.js 18 or later. No package installation is needed.

In PowerShell, set your Gemini API key for the current terminal and start the app:

```powershell
$env:GEMINI_API_KEY="your_gemini_api_key"
npm start
```

Then open [http://localhost:3000](http://localhost:3000). To use another port, set `$env:PORT` before starting the server. The API key stays on the server and is never sent to the browser. Without a key, task planning and local saving still work, but Gemini verification will return a setup message.

## How it works

- Add quests with a due date and a little, medium, or big XP reward.
- The app opens directly into a single no-page-scroll dashboard: your pet stays centered in a deep-violet, firefly-lit forest, while quests and semester progress remain visible beside it. Focus, wellness, radio, and keepsakes open from the small scene buttons.
- Name your pet from the header and click the painted forest sprite to say hello. It breathes, blinks, and occasionally gets curious or sleepy while idle, with a happy expression when greeted. Dress it up in the keepsakes section.
- The interface uses drawn shapes and lettering rather than emoji graphics; a glowing firefly follows the mouse pointer on desktop.
- Your return streak grows when you visit on consecutive local calendar days. It saves in this browser, highlights the last seven days, and does not increase on repeated reloads the same day.
- When a quest is finished, describe your evidence and ask Gemini to check it. Verified quests award the same amount in XP and dewdrops.
- Your friend gains one level per 100 XP. Quests, XP, dewdrops, accessories, your pet's name, and the editable semester end date are saved in this browser's local storage.
- Use the quest filter to view all quests, growing quests, or completed quests.
- Complete a 25-minute focus session for 10 dewdrops. A daily wellness check-in and watering the garden each award 5, and catching a firefly awards 2. Daily rewards are limited to once per activity per local calendar day.
- Play the embedded Spotify lo-fi playlist or open it in Spotify. Playback requires an internet connection and may ask you to sign in.

The semester countdown starts at December 18, 2026 and can be changed in the semester journey section below the night garden.
