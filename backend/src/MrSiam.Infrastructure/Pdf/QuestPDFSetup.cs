namespace MrSiam.Infrastructure.Pdf;

/// <summary>
/// تهيئة QuestPDF: الترخيص وتسجيل خطوط Tajawal بأسماء مخصصة تُستخدم في الوثائق.
/// </summary>
public static class QuestPDFSetup
{
    public static void Configure(string baseDirectory)
    {
        QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

        var fontDir = Path.Combine(baseDirectory, "Fonts");
        var regular = Path.Combine(fontDir, "Tajawal-Regular.ttf");
        var bold = Path.Combine(fontDir, "Tajawal-Bold.ttf");

        if (File.Exists(regular))
        {
            using var stream = File.OpenRead(regular);
            QuestPDF.Drawing.FontManager.RegisterFontWithCustomName("Tajawal", stream);
        }

        if (File.Exists(bold))
        {
            using var stream = File.OpenRead(bold);
            QuestPDF.Drawing.FontManager.RegisterFontWithCustomName("TajawalBold", stream);
        }
    }
}