using DiscordRPC;

class DiscordService : IDisposable
{
    private readonly DiscordRpcClient _client;

    public DiscordService(string appId)
    {
        _client = new DiscordRpcClient(appId);
        _client.Initialize();
    }

    public void Update(TrackMessage msg)
    {
        if (msg.State == "stopped" || msg.State == "paused")
        {
            _client.ClearPresence();
            return;
        }

        _client.SetPresence(new RichPresence
        {
            Details = msg.Title ?? "Unknown Title",
            State = msg.Artist ?? "Unknown Artist",
            Type = ServiceToActivityType(msg.Service),
            Assets = new Assets
            {
                LargeImageKey = "youtube",
                LargeImageText = ServiceToLabel(msg.Service)
            }
        });
    }

    public void Dispose() => _client.Dispose();

    private static ActivityType ServiceToActivityType(string? service) => service switch
    {
        "ytmusic" => ActivityType.Listening,
        _ => ActivityType.Watching
    };

    private static string ServiceToLabel(string? service) => service switch
    {
        "ytmusic"  => "YouTube Music",
        "youtube"  => "YouTube",
        "ytshorts" => "YouTube Shorts",
        "ytlive"   => "YouTube Live",
        "yttv"     => "YouTube TV",
        _ => "YouTube"
    };
}
