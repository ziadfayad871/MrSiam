namespace MrSiam.Application.Abstractions;

public interface IWhatsAppService
{
    /// <summary>يرسل رسالة واتساب لرقم (بالصيغة الدولية، مثال +2012...). يرجع true عند النجاح ولا يرمي استثناء.</summary>
    Task<bool> SendAsync(string phone, string message, CancellationToken ct = default);
}