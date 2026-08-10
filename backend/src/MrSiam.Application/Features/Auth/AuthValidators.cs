using FluentValidation;

namespace MrSiam.Application.Features.Auth;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Username).NotEmpty().WithMessage("اسم المستخدم مطلوب");
        RuleFor(x => x.Password).NotEmpty().WithMessage("كلمة المرور مطلوبة");
    }
}

public class RegisterStudentCommandValidator : AbstractValidator<RegisterStudentCommand>
{
    public RegisterStudentCommandValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MinimumLength(5).WithMessage("الاسم الكامل مطلوب");
        RuleFor(x => x.StudentCode).NotEmpty().WithMessage("كود الطالب مطلوب");
        RuleFor(x => x.GuardianPhone).NotEmpty().WithMessage("رقم ولي الأمر مطلوب");
        RuleFor(x => x.Username).NotEmpty().MinimumLength(3).WithMessage("اسم المستخدم مطلوب");
        RuleFor(x => x.Password).MinimumLength(6).WithMessage("كلمة المرور 6 أحرف على الأقل");
    }
}
