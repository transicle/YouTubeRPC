using System.Text.Json;
using Microsoft.Win32;

static class Installer
{
    private const string HostName = "com.youtuberpc.host";
    private const string ChromiumExtensionId = "EXTENSION_ID_HERE";
    private const string FirefoxExtensionId = "youtuberpc@PLACEHOLDER";

    public static void Install()
    {
        string exePath = Environment.ProcessPath!;
        string dataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "YouTubeRPC");
        Directory.CreateDirectory(dataDir);

        string chromiumManifest = Path.Combine(dataDir, "manifest_chromium.json");
        string firefoxManifest = Path.Combine(dataDir, "manifest_firefox.json");

        WriteChromiumManifest(chromiumManifest, exePath);
        WriteFirefoxManifest(firefoxManifest, exePath);

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var browser in Browsers.All)
        {
            string manifestPath = browser.Type == Browsers.BrowserType.Firefox ? firefoxManifest : chromiumManifest;
            string regPath = $@"{browser.RegistryPath}\{HostName}";

            if (!seen.Add(regPath)) continue;

            Registry.CurrentUser.CreateSubKey(regPath).SetValue("", manifestPath);
        }

        Registry.CurrentUser
            .OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", writable: true)!
            .SetValue("YouTubeRPC", $"\"{exePath}\"");
    }

    public static void Uninstall()
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var browser in Browsers.All)
        {
            string regPath = $@"{browser.RegistryPath}\{HostName}";
            if (!seen.Add(regPath)) continue;
            Registry.CurrentUser.DeleteSubKey(regPath, throwOnMissingSubKey: false);
        }

        Registry.CurrentUser
            .OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", writable: true)!
            .DeleteValue("YouTubeRPC", throwOnMissingValue: false);

        string dataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "YouTubeRPC");
        if (Directory.Exists(dataDir))
            Directory.Delete(dataDir, recursive: true);
    }

    private static void WriteChromiumManifest(string path, string exePath)
    {
        var manifest = new
        {
            name = HostName,
            description = "YouTubeRPC Native Messaging Host",
            path = exePath,
            type = "stdio",
            allowed_origins = new[] { $"chrome-extension://{ChromiumExtensionId}/" }
        };
        File.WriteAllText(path, JsonSerializer.Serialize(manifest, new JsonSerializerOptions { WriteIndented = true }));
    }

    private static void WriteFirefoxManifest(string path, string exePath)
    {
        var manifest = new
        {
            name = HostName,
            description = "YouTubeRPC Native Messaging Host",
            path = exePath,
            type = "stdio",
            allowed_extensions = new[] { FirefoxExtensionId }
        };
        File.WriteAllText(path, JsonSerializer.Serialize(manifest, new JsonSerializerOptions { WriteIndented = true }));
    }
}
