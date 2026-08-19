namespace MrSiam.Application.Abstractions;

public interface IWhatsAppService
{
    /// <summary>يرسل رسالة واتساب لرقم (بالصيغة الدولية، مثال +2012...). يرجع true عند النجاح ولا يرمي استثناء.</summary>
    Task<bool> SendAsync(string phone, string message, CancellationToken ct = default);

    /// <summary>يرسل مستند (PDF) مع رسالة مرافقة. للبوابات اللي مش بتدعم مستندات بيترجع إرسال النص بس.</summary>
    Task<bool> SendDocumentAsync(string phone, string message, byte[] content, string fileName, string contentType = "application/pdf", CancellationToken ct = default);
}