namespace MrSiam.Domain.Enums;

public enum Subject
{
    History = 1,
    Geography = 2,
    SocialStudies = 3
}

public static class SubjectExtensions
{
    public static string ToArabic(this Subject subject) => subject switch
    {
        Subject.History => "التاريخ",
        Subject.Geography => "الجغرافيا",
        Subject.SocialStudies => "الدراسات الاجتماعية",
        _ => subject.ToString()
    };
}
