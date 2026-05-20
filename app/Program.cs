using System.Text;
using System.Text.Json;

const string AppId = "1506802151291228191";

if (args.Length > 0 && args[0] == "--install")
{
    Installer.Install();
    Console.WriteLine("Installed successfully.");
    return;
}

if (args.Length > 0 && args[0] == "--uninstall")
{
    Installer.Uninstall();
    Console.WriteLine("Uninstalled successfully.");
    return;
}

using var discord = new DiscordService(AppId);
using var stdin = Console.OpenStandardInput();
using var reader = new BinaryReader(stdin, Encoding.UTF8, leaveOpen: true);

var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

while (true)
{
    byte[] lengthBytes;
    try
    {
        lengthBytes = reader.ReadBytes(4);
    }
    catch
    {
        break;
    }

    if (lengthBytes.Length < 4) break;

    int length = BitConverter.ToInt32(lengthBytes, 0);
    if (length <= 0 || length > 1_000_000) break;

    byte[] messageBytes = reader.ReadBytes(length);
    string json = Encoding.UTF8.GetString(messageBytes);

    try
    {
        var msg = JsonSerializer.Deserialize<TrackMessage>(json, jsonOptions);
        if (msg is null) continue;
        discord.Update(msg);
    }
    catch (JsonException) { }
}

