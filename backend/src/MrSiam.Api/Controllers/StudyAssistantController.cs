using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Common;
using MrSiam.Application.Features.Study;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/study")]
[Authorize]
public class StudyAssistantController(IMediator mediator) : ControllerBase
{
    [HttpPost("summary")]
    public async Task<ActionResult<ApiResponse<StudySummaryResultDto>>> Summary([FromBody] BuildLessonSummaryCommand command, CancellationToken ct)
        => Ok(await mediator.Send(command, ct));

    [HttpPost("flashcards")]
    public async Task<ActionResult<ApiResponse<List<FlashcardDto>>>> Flashcards([FromBody] BuildFlashcardsCommand command, CancellationToken ct)
        => Ok(await mediator.Send(command, ct));

    [HttpPost("compare")]
    public async Task<ActionResult<ApiResponse<CompareResultDto>>> Compare([FromBody] CompareTopicsCommand command, CancellationToken ct)
        => Ok(await mediator.Send(command, ct));
}
