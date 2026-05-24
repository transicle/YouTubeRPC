import sys
import json
import os
import struct
import time
import ctypes
import winreg
import win32file
from pathlib import Path

VERSION          = "1.0.0"
APP_ID           = "1506802151291228191"
HOST_NAME        = "com.youtuberpc.host"
EXTENSION_ID     = "youtuberpc@PLACEHOLDER"


def is_browser_spawned() -> bool:
    try:
        handle = ctypes.windll.kernel32.GetStdHandle(-10)
        if handle == 0 or ctypes.c_long(handle).value == -1:
            return False
        return ctypes.windll.kernel32.GetFileType(handle) == 3
    except Exception:
        return False


def read_message() -> dict | None:
    raw = sys.stdin.buffer.read(4)
    if len(raw) < 4:
        return None
    (length,) = struct.unpack('<I', raw)
    data = sys.stdin.buffer.read(length)
    return json.loads(data) if len(data) == length else None


def send_message(obj: dict) -> None:
    payload = json.dumps(obj).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('<I', len(payload)))
    sys.stdout.buffer.write(payload)
    sys.stdout.buffer.flush()


class DiscordPipe:

    def __init__(self):
        self._pipe = None

    def _open(self):
        
        for i in range(10):
            try:
                pipe = win32file.CreateFile(
                    rf"\\.\pipe\discord-ipc-{i}",
                    win32file.GENERIC_READ | win32file.GENERIC_WRITE,
                    0, None,
                    win32file.OPEN_EXISTING,
                    win32file.FILE_FLAG_OVERLAPPED | win32file.FILE_ATTRIBUTE_NORMAL,
                    None,
                )
                self._write_frame(pipe, 0, {"v": 1, "client_id": APP_ID})
                time.sleep(0.3)
                self._pipe = pipe
                return pipe
            except Exception:
                continue
        return None

    def _write_frame(self, pipe, op: int, payload: dict) -> bool:
        try:
            data = json.dumps(payload).encode('utf-8')
            win32file.WriteFile(pipe, struct.pack('<II', op, len(data)) + data)
            return True
        except Exception:
            return False

    def _send(self, op: int, payload: dict) -> bool:
        if not self._pipe:
            self._open()
        if not self._pipe:
            return False
        if not self._write_frame(self._pipe, op, payload):
            self._pipe = None
            self._open()
            if not self._pipe:
                return False
            return self._write_frame(self._pipe, op, payload)
        return True

    def set_activity(self, activity: dict | None) -> None:
        self._send(1, {
            "cmd":   "SET_ACTIVITY",
            "args":  {"pid": os.getpid(), "activity": activity},
            "nonce": str(int(time.time())),
        })

    def clear(self) -> None:
        self.set_activity(None)

    def close(self) -> None:
        if self._pipe:
            try:
                win32file.CloseHandle(self._pipe)
            except Exception:
                pass
            self._pipe = None


def _service_label(svc: str) -> str:
    return {
        'ytmusic':  'YouTube Music',
        'ytshorts': 'YouTube Shorts',
        'ytlive':   'YouTube Live',
        'yttv':     'YouTube TV',
    }.get(svc, 'YouTube')


def build_activity(msg: dict) -> dict:
    state      = msg.get('state', 'stopped')
    title      = (msg.get('title')  or 'Unknown')[:128]
    artist     = (msg.get('artist') or '')
    svc        = msg.get('service', 'youtube')
    start_time = msg.get('startTime')
    thumbnail  = msg.get('thumbnail')
    page_url   = msg.get('pageUrl')

    paused = state == 'paused'

    timestamps: dict | None = None
    if start_time is not None:
        timestamps = {
            'start': int(start_time // 1000),
        }

    large_image = (
        thumbnail if (thumbnail and thumbnail.startswith('https://'))
        else 'youtube'
    )

    state_text = (f'\u23f8\u2002{artist}' if paused else artist)[:128]

    name_parts = [title]
    if artist:
        name_parts.append(artist)
    activity_name = ' \u2022 '.join(name_parts)[:128]

    activity: dict = {
        'name':    activity_name,
        'type':    2 if svc == 'ytmusic' else 3,
        'details': title,
        'assets':  {
            'large_image': large_image,
            'large_text':  _service_label(svc),
        },
    }
    if state_text:
        activity['state'] = state_text
    if timestamps:
        activity['timestamps'] = timestamps
    if page_url and page_url.startswith('http'):
        label = 'Listen on YouTube Music' if svc == 'ytmusic' else 'Watch on YouTube'
        activity['buttons'] = [{'label': label, 'url': page_url}]

    return activity


def run_host() -> None:
    discord = DiscordPipe()
    try:
        while True:
            msg = read_message()
            if msg is None:
                break

            action = (msg.get('action') or '').lower()
            if action == 'ping':
                send_message({'action': 'pong', 'version': VERSION})
                continue

            state = msg.get('state', 'stopped')
            if state == 'stopped':
                discord.clear()
                continue

            try:
                discord.set_activity(build_activity(msg))
            except Exception:
                pass
    finally:
        discord.clear()
        discord.close()


def _icon_path() -> Path:
    if getattr(sys, 'frozen', False):
        return Path(sys.executable).parent / 'icons' / 'youtube.png'
    return Path(__file__).parent.parent / 'icons' / 'youtube.png'


def run_tray() -> None:
    try:
        import pystray
        from PIL import Image
    except ImportError:
        return

    icon_file = _icon_path()
    image = Image.open(str(icon_file)) if icon_file.exists() else Image.new('RGBA', (64, 64), (255, 0, 0, 255))

    def on_quit(icon, _):
        icon.stop()

    menu = pystray.Menu(
        pystray.MenuItem('YouTube RPC', None, enabled=False),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem('Exit', on_quit),
    )
    pystray.Icon('YouTubeRPC', image, 'YouTube RPC', menu).run()


def _exe_path() -> str:
    return sys.executable if getattr(sys, 'frozen', False) else os.path.abspath(__file__)


def install() -> None:
    exe = _exe_path()

    manifest_dir = Path(os.environ['APPDATA']) / 'YouTube RPC'
    manifest_dir.mkdir(exist_ok=True)
    manifest_path = manifest_dir / 'manifest.json'

    manifest = {
        "name":                HOST_NAME,
        "description":         "YouTubeRPC native messaging host",
        "path":                exe,
        "type":                "stdio",
        "allowed_extensions":  [EXTENSION_ID],
    }
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding='utf-8')

    for sub in [
        rf'Software\Mozilla\NativeMessagingHosts\{HOST_NAME}',
        rf'Software\Zen Browser\NativeMessagingHosts\{HOST_NAME}',
        rf'Software\Google\Chrome\NativeMessagingHosts\{HOST_NAME}',
        rf'Software\Chromium\NativeMessagingHosts\{HOST_NAME}',
    ]:
        try:
            with winreg.CreateKey(winreg.HKEY_CURRENT_USER, sub) as key:
                winreg.SetValueEx(key, '', 0, winreg.REG_SZ, str(manifest_path))
        except Exception:
            pass

    try:
        with winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r'Software\Microsoft\Windows\CurrentVersion\Run',
            access=winreg.KEY_SET_VALUE,
        ) as key:
            winreg.SetValueEx(key, 'YouTubeRPC', 0, winreg.REG_SZ, f'"{exe}"')
    except Exception:
        pass

    ctypes.windll.user32.MessageBoxW(
        None,
        f'YouTube RPC installed successfully.\n\nHost: {exe}\nManifest: {manifest_path}',
        'YouTube RPC',
        0x40,
    )


def uninstall() -> None:
    for sub in [
        rf'Software\Mozilla\NativeMessagingHosts\{HOST_NAME}',
        rf'Software\Zen Browser\NativeMessagingHosts\{HOST_NAME}',
        rf'Software\Google\Chrome\NativeMessagingHosts\{HOST_NAME}',
        rf'Software\Chromium\NativeMessagingHosts\{HOST_NAME}',
    ]:
        try:
            winreg.DeleteKey(winreg.HKEY_CURRENT_USER, sub)
        except Exception:
            pass

    try:
        with winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r'Software\Microsoft\Windows\CurrentVersion\Run',
            access=winreg.KEY_SET_VALUE,
        ) as key:
            winreg.DeleteValue(key, 'YouTubeRPC')
    except Exception:
        pass

    ctypes.windll.user32.MessageBoxW(None, 'YouTube RPC uninstalled.', 'YouTube RPC', 0x40)


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    if '--install' in sys.argv:
        install()
        return
    if '--uninstall' in sys.argv:
        uninstall()
        return

    if is_browser_spawned():
        run_host()
    else:
        run_tray()


if __name__ == '__main__':
    main()
