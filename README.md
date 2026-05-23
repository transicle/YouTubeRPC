# YouTube RPC

**https://github.com/transicle/YouTubeRPC**

FireFox and Chrome browser plugin and Windows app for displaying a clean, rich presence on Discord.

- Made to replace PreMiD for *these services explicitly*, due to PreMiD being horrible and full of bugs.

## Supported Services

- **YouTube**
- **YouTube Music**
- **YouTube Shorts**
- **YouTube Live**
- **YouTube TV**

## Issues

**Stray brace in mediasession.js causes syntax error**: A stray `}` at the end of `mediasession.js` makes the file a JavaScript syntax error. The entire content script fails to load silently, so no logs, no RPC, and no error anywhere obvious to point to it.

**inject.js CustomEvents fire before the isolated-world listener is attached**: `inject.js` runs at `document_start` in the MAIN world, but `mediasession.js` loads at `document_idle`. Any `setPositionState` calls YouTube Music makes during that gap dispatch events that nobody is listening to yet, leaving `_ytRpcDuration` null until the next call.

**waitForReady calls its callback even after timing out**: After 25 failed poll attempts the callback fired unconditionally regardless of whether the new song was actually ready. This sends a Discord update with a null duration and potentially wrong title right before the 5-second safety timer would have handled it more cleanly.

**Chrome and Chromium are not registered during install**: `install()` only writes native messaging registry keys for Firefox and Zen Browser. Chrome and Chromium need their own keys under `Software\Google\Chrome\NativeMessagingHosts` and `Software\Chromium\NativeMessagingHosts` or the host binary is never found.

**DiscordPipe never reads IPC responses**: Discord sends a READY response after the handshake and an acknowledgement after every SET_ACTIVITY. None of these are ever read. The pipe read buffer fills up over a long session and can eventually cause writes to fail or block.

**Script injection via `<script>` element is blocked by page CSP**: The previous approach of injecting `inject.js` by appending a `<script src="moz-extension://...">` element from the content script does not work. YouTube Music has a strict CSP and Firefox enforces it for extension-origin scripts loaded this way, unlike Chrome which has an exemption. The fix is using `world: "MAIN"` in the manifest content scripts entry.

**waitForVideo only attaches to the first video element found**: If YouTube ever removes and recreates the `<video>` element during a SPA navigation, the new element never gets any listeners and playback state stops updating entirely.

**onConnect listener parameter shadows the native messaging port variable**: The `port` parameter in `browserAPI.runtime.onConnect.addListener((port) => {...})` has the same name as the module-level `let port` used for the native messaging connection. It works by accident right now but any future edit inside that callback could silently affect the wrong port.

**DiscordPipe handshake uses a fixed 300ms sleep instead of reading the READY response**: After sending the opcode-0 handshake the code sleeps 300ms and then assumes the pipe is ready. On a slow or loaded system Discord may not have responded in time, and on a fast system that 300ms is just wasted before every reconnect.