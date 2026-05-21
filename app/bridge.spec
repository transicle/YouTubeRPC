# Build:  cd app  &&  python -m PyInstaller bridge.spec

a = Analysis(
    ['bridge.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('../icons/youtube.png', 'icons'),
    ],
    hiddenimports=[
        'win32file',
        'win32con',
        'win32api',
        'pywintypes',
        'win32timezone',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='YouTubeRPC.Host',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='../icons/youtube.png',
)
