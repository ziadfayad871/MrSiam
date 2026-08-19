using System.Text;

namespace MrSiam.Application.Common;

/// <summary>
/// أدوات صغيرة لتنسيق النصوص العربية: أرقام عربية/هندية وكتابة المبلغ بالكلمات.
/// </summary>
public static class ArabicText
{
    public static string ToArabicDigits(string value)
    {
        if (string.IsNullOrEmpty(value)) return value;
        var sb = new StringBuilder(value.Length);
        foreach (var c in value)
        {
            sb.Append(c switch
            {
                '0' => '٠',
                '1' => '١',
                '2' => '٢',
                '3' => '٣',
                '4' => '٤',
                '5' => '٥',
                '6' => '٦',
                '7' => '٧',
                '8' => '٨',
                '9' => '٩',
                '.' => '٫',
                _ => c
            });
        }
        return sb.ToString();
    }

    public static string AmountToArabicWords(decimal amount)
    {
        var pounds = (long)Math.Floor(amount);
        var piastres = (int)Math.Round((amount - pounds) * 100);
        var words = NumberToWords(pounds);
        if (pounds == 0) words = "صفر";
        words += " جنيه";
        if (piastres > 0)
            words += " و" + NumberToWords(piastres) + " قرش";
        return words;
    }

    private static string NumberToWords(long n)
    {
        if (n == 0) return "صفر";

        var units = new[] { "", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة" };
        var teens = new[] { "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر" };
        var tens = new[] { "", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون" };

        var builder = new StringBuilder();

        var thousands = n / 1000;
        var rest = n % 1000;
        if (thousands > 0)
        {
            if (thousands == 1) builder.Append("ألف");
            else if (thousands == 2) builder.Append("ألفان");
            else if (thousands <= 10) builder.Append(units[thousands]).Append(" آلاف");
            else builder.Append(NumberToWords(thousands)).Append(" ألف");
            if (rest > 0) builder.Append(" و");
        }

        var hundreds = rest / 100;
        rest %= 100;
        if (hundreds == 1) builder.Append("مائة");
        else if (hundreds == 2) builder.Append("مائتان");
        else if (hundreds > 2) builder.Append(units[hundreds]).Append("مائة");
        if (hundreds > 0 && rest > 0) builder.Append(" و");

        if (rest > 0)
        {
            if (rest < 10) builder.Append(units[rest]);
            else if (rest < 20) builder.Append(teens[rest - 10]);
            else
            {
                var t = rest / 10;
                var u = rest % 10;
                builder.Append(tens[t]);
                if (u > 0) builder.Append(" و").Append(units[u]);
            }
        }

        return builder.ToString();
    }
}