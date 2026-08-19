using MrSiam.Application.Abstractions;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MrSiam.Infrastructure.Pdf;

/// <summary>
/// إيصال سداد عربي (RTL) بنفس شكل المطبوع من الواجهة: شعار السنتر + بيانات الطالب + مبلغ سداد.
/// </summary>
public sealed class ReceiptPdfBuilder : IReceiptPdfBuilder
{
    public byte[] BuildReceiptPdf(ReceiptPdfData data)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(24);
                page.DefaultTextStyle(style => style.FontFamily("Tajawal").FontSize(11).FontColor("#16121F"));
                page.PageColor(Colors.White);

                page.Content().Column(col =>
                {
                    col.Spacing(10);

                    col.Item().AlignCenter().Column(header =>
                    {
                        header.Spacing(2);
                        header.Item().AlignCenter().Text("مستر محمد صيام").FontFamily("TajawalBold").FontSize(20).FontColor("#C89B3C");
                        header.Item().AlignCenter().Text("مع أبو كيان .. الدراسات في أمان").FontSize(11).FontColor("#6B6B76");
                    });

                    col.Item().PaddingVertical(2).LineHorizontal(2).LineColor("#C89B3C");

                    col.Item().AlignCenter().Text("إيصال سداد").FontFamily("TajawalBold").FontSize(16);

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });

                        void Row(string label, string value)
                        {
                            table.Cell().Background("#F6F1E6").Padding(8).Text(label).FontFamily("TajawalBold").FontColor("#16121F");
                            table.Cell().Padding(8).Text(value).FontColor("#16121F");
                        }

                        Row("رقم الإيصال", data.ReceiptNumber);
                        Row("اسم الطالب", data.StudentName);
                        Row("المرحلة", data.StageAr);
                        Row("كود الطالب", data.StudentCode);
                        Row("اسم المستخدم", data.Username);
                        Row("الشهر", data.Month);
                        Row("طريقة الدفع", data.Method);
                        Row("المبلغ", data.AmountDigits);
                    });

                    col.Item().PaddingTop(4).Background("#EEF6F1").Border(1).BorderColor("#2E7D5B").Padding(10).Column(amount =>
                    {
                        amount.Spacing(4);
                        amount.Item().Text("المبلغ بالحروف:").FontFamily("TajawalBold").FontSize(12);
                        amount.Item().Text(data.AmountWords).FontSize(12).FontColor("#1F6A48");
                    });

                    col.Item().AlignCenter().Text("تاريخ السداد: " + data.PaidAtText).FontSize(11).FontColor("#6B6B76");

                    col.Item().PaddingTop(8).AlignCenter().Text("شكرًا لثقتكم.. هذا الإيصال يعد مستندًا رسميًا للسداد").FontSize(10).FontColor("#6B6B76");
                });
            });
        }).GeneratePdf();
    }
}