using FluentValidation;

namespace MrSiam.Application.Features.Attempts;

public class SubmitAttemptCommandValidator : AbstractValidator<SubmitAttemptCommand>
{
    public SubmitAttemptCommandValidator()
    {
        RuleFor(x => x.ExamId).GreaterThan(0);
        RuleFor(x => x.StudentId).GreaterThan(0);
        RuleFor(x => x.Answers).NotNull();
    }
}
