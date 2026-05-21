// THIS FILE WAS GENERATED USING AI.

// IF THE PATHS ARE WRONG, PLEASE CREATE AN ISSUE OR A PULL REQUEST FIXING IT!

// AS WELL AS ADDING ANY BROWSERS I MISSED :)

static class Browsers
{
    public record BrowserEntry(string Name, string RegistryPath);

    public static readonly BrowserEntry[] All =
    [
        // Chromium-based
        new("Chrome",             @"Software\Google\Chrome\NativeMessagingHosts"),
        new("Edge",               @"Software\Microsoft\Edge\NativeMessagingHosts"),
        new("Brave",              @"Software\BraveSoftware\Brave-Browser\NativeMessagingHosts"),
        new("Vivaldi",            @"Software\Vivaldi\NativeMessagingHosts"),
        new("Opera",              @"Software\Opera Software\Opera Stable\NativeMessagingHosts"),
        new("Opera GX",           @"Software\Opera Software\Opera GX Stable\NativeMessagingHosts"),
        new("Chromium",           @"Software\Chromium\NativeMessagingHosts"),
        new("Yandex Browser",     @"Software\Yandex\YandexBrowser\NativeMessagingHosts"),
        new("Thorium",            @"Software\Thorium\NativeMessagingHosts"),
        new("Arc",                @"Software\TheBrowserCompany\Arc\NativeMessagingHosts"),
        new("Whale",              @"Software\Naver\Whale\NativeMessagingHosts"),
        new("Ungoogled Chromium", @"Software\Chromium\NativeMessagingHosts"),

        // Firefox-based
        new("Firefox",            @"Software\Mozilla\NativeMessagingHosts"),
        new("LibreWolf",          @"Software\Mozilla\NativeMessagingHosts"),
        new("Zen Browser",        @"Software\Mozilla\NativeMessagingHosts"),
        new("Waterfox",           @"Software\Waterfox\NativeMessagingHosts"),
        new("Floorp",             @"Software\Floorp\NativeMessagingHosts"),
        new("Pale Moon",          @"Software\Moonchild Productions\Pale Moon\NativeMessagingHosts"),
        new("Basilisk",           @"Software\Moonchild Productions\Basilisk\NativeMessagingHosts"),
        new("Mercury",            @"Software\Mozilla\NativeMessagingHosts"),
    ];
}
