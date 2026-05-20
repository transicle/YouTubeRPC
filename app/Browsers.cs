// THIS FILE WAS GENERATED USING AI.

// IF THE PATHS ARE WRONG, PLEASE CREATE AN ISSUE OR A PULL REQUEST FIXING IT!

// AS WELL AS ADDING ANY BROWSERS I MISSED :)

static class Browsers
{
    public enum BrowserType { Chromium, Firefox }

    public record BrowserEntry(string Name, string RegistryPath, BrowserType Type);

    public static readonly BrowserEntry[] All =
    [
        // Chromium-based
        new("Chrome",             @"Software\Google\Chrome\NativeMessagingHosts",                    BrowserType.Chromium),
        new("Edge",               @"Software\Microsoft\Edge\NativeMessagingHosts",                   BrowserType.Chromium),
        new("Brave",              @"Software\BraveSoftware\Brave-Browser\NativeMessagingHosts",      BrowserType.Chromium),
        new("Vivaldi",            @"Software\Vivaldi\NativeMessagingHosts",                          BrowserType.Chromium),
        new("Opera",              @"Software\Opera Software\Opera Stable\NativeMessagingHosts",      BrowserType.Chromium),
        new("Opera GX",           @"Software\Opera Software\Opera GX Stable\NativeMessagingHosts",   BrowserType.Chromium),
        new("Chromium",           @"Software\Chromium\NativeMessagingHosts",                         BrowserType.Chromium),
        new("Yandex Browser",     @"Software\Yandex\YandexBrowser\NativeMessagingHosts",             BrowserType.Chromium),
        new("Thorium",            @"Software\Thorium\NativeMessagingHosts",                          BrowserType.Chromium),
        new("Arc",                @"Software\TheBrowserCompany\Arc\NativeMessagingHosts",            BrowserType.Chromium),
        new("Whale",              @"Software\Naver\Whale\NativeMessagingHosts",                      BrowserType.Chromium),
        new("Ungoogled Chromium", @"Software\Chromium\NativeMessagingHosts",                         BrowserType.Chromium),

        // Firefox-based
        new("Firefox",            @"Software\Mozilla\NativeMessagingHosts",                          BrowserType.Firefox),
        new("LibreWolf",          @"Software\Mozilla\NativeMessagingHosts",                          BrowserType.Firefox),
        new("Zen Browser",        @"Software\Mozilla\NativeMessagingHosts",                          BrowserType.Firefox),
        new("Waterfox",           @"Software\Waterfox\NativeMessagingHosts",                         BrowserType.Firefox),
        new("Floorp",             @"Software\Floorp\NativeMessagingHosts",                           BrowserType.Firefox),
        new("Pale Moon",          @"Software\Moonchild Productions\Pale Moon\NativeMessagingHosts",  BrowserType.Firefox),
        new("Basilisk",           @"Software\Moonchild Productions\Basilisk\NativeMessagingHosts",   BrowserType.Firefox),
        new("Mercury",            @"Software\Mozilla\NativeMessagingHosts",                          BrowserType.Firefox),
    ];
}
