using System.Reflection;
using System.Text;
using System.Text.Json;

class TrayContext : ApplicationContext
{
    private readonly NotifyIcon _trayIcon;
    private readonly DiscordService _discord;
    private readonly SynchronizationContext _syncContext;

    public TrayContext(string appId)
    {
        _syncContext = SynchronizationContext.Current!;
        _discord = new DiscordService(appId);

        _trayIcon = new NotifyIcon
        {
            Icon = LoadIcon(),
            Text = "YouTube RPC",
            Visible = true,
            ContextMenuStrip = BuildMenu()
        };

        new Thread(NativeMessagingLoop) { IsBackground = true, Name = "NativeMessaging" }.Start();
    }

    private void NativeMessagingLoop()
    {
        var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        using var stdin = Console.OpenStandardInput();
        using var reader = new BinaryReader(stdin, Encoding.UTF8, leaveOpen: true);

        while (true)
        {
            byte[] lengthBytes;
            try { lengthBytes = reader.ReadBytes(4); }
            catch { break; }

            if (lengthBytes.Length < 4) break;

            int length = BitConverter.ToInt32(lengthBytes, 0);
            if (length <= 0 || length > 1_000_000) break;

            byte[] messageBytes = reader.ReadBytes(length);
            string json = Encoding.UTF8.GetString(messageBytes);

            try
            {
                var msg = JsonSerializer.Deserialize<TrackMessage>(json, jsonOptions);
                if (msg is null) continue;
                _discord.Update(msg);
                _syncContext.Post(_ => UpdateTooltip(msg), null);
            }
            catch (JsonException) { }
        }

        _discord.Update(new TrackMessage(null, null, null, "stopped"));
        _syncContext.Post(_ => _trayIcon.Text = "YouTube RPC", null);
    }

    private void UpdateTooltip(TrackMessage msg)
    {
        string text = msg.State == "playing" && msg.Title is not null
            ? $"YouTube RPC \u2014 {msg.Title}"
            : "YouTube RPC";
        _trayIcon.Text = text.Length > 63 ? text[..63] : text;
    }

    private ContextMenuStrip BuildMenu()
    {
        var menu = new ContextMenuStrip();
        menu.Items.Add("Exit", null, (_, _) =>
        {
            _trayIcon.Visible = false;
            Application.Exit();
        });
        return menu;
    }

    private static Icon LoadIcon()
    {
        using var stream = Assembly.GetExecutingAssembly()
            .GetManifestResourceStream("YouTube RPC.Host.youtube.png");
        if (stream is not null)
        {
            using var bmp = new Bitmap(stream);
            return Icon.FromHandle(bmp.GetHicon());
        }
        return SystemIcons.Application;
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _trayIcon.Visible = false;
            _trayIcon.Dispose();
            _discord.Dispose();
        }
        base.Dispose(disposing);
    }
}
