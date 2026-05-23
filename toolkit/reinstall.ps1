Get-Process -Name YouTubeRPC.Host -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
py -m PyInstaller app\bridge.spec
.\dist\YouTubeRPC.Host.exe --install