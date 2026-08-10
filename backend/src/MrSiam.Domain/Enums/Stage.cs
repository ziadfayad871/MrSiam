namespace MrSiam.Domain.Enums;

public enum Stage
{
    PrepOne = 1,
    PrepTwo = 2,
    PrepThree = 3,
    SecOne = 4,
    SecTwo = 5,
    SecThree = 6
}

public static class StageExtensions
{
    public static string ToArabic(this Stage stage) => stage switch
    {
        Stage.PrepOne => "الصف الأول الإعدادي",
        Stage.PrepTwo => "الصف الثاني الإعدادي",
        Stage.PrepThree => "الصف الثالث الإعدادي",
        Stage.SecOne => "الأول الثانوي",
        Stage.SecTwo => "الثاني الثانوي",
        Stage.SecThree => "الثالث الثانوي",
        _ => stage.ToString()
    };

    public static bool IsPreparatory(this Stage stage) => stage <= Stage.PrepThree;
}
