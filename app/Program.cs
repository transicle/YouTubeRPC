const string AppId = "1506802151291228191";

if (args.Length > 0 && args[0] == "--install")
{
    Installer.Install();
    MessageBox.Show("YouTube RPC installed successfully.", "YouTube RPC", MessageBoxButtons.OK, MessageBoxIcon.Information);
    return;
}

if (args.Length > 0 && args[0] == "--uninstall")
{
    Installer.Uninstall();
    MessageBox.Show("YouTube RPC uninstalled successfully.", "YouTube RPC", MessageBoxButtons.OK, MessageBoxIcon.Information);
    return;
}

Application.EnableVisualStyles();
Application.SetCompatibleTextRenderingDefault(false);

using var appContext = new TrayContext(AppId);
Application.Run(appContext);

