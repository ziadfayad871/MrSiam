using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using MrSiam.Application;
using MrSiam.Infrastructure;
using MrSiam.Infrastructure.Security;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/mrsiam-.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 14)
    .CreateLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog();

    builder.Services
        .AddApplication()
        .AddInfrastructure(builder.Configuration);

    builder.Services
        .AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        });
    builder.Services.AddOpenApi();
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<MrSiam.Application.Abstractions.ICurrentUserService, MrSiam.Api.Services.CurrentUserService>();

    builder.Services.AddHttpClient("gemini", client =>
    {
        client.Timeout = TimeSpan.FromSeconds(180);
    });
    builder.Services.AddScoped<MrSiam.Application.Abstractions.IGeminiService, MrSiam.Infrastructure.AI.GeminiService>();

    var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins")
        .Get<string>()?
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        ?? ["http://localhost:5173", "http://localhost:4173", "https://localhost:5173"];

    var allowAllOrigins = corsOrigins.Contains("*", StringComparer.OrdinalIgnoreCase);

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("Frontend", policy =>
        {
            if (allowAllOrigins)
            {
                policy.AllowAnyOrigin()
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            }
            else
            {
                policy.WithOrigins(corsOrigins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            }
        });
    });

    var jwtSection = builder.Configuration.GetSection(JwtOptions.SectionName);
    var jwt = jwtSection.Get<JwtOptions>() ?? new JwtOptions();

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwt.Issuer,
                ValidateAudience = true,
                ValidAudience = jwt.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(2)
            };
        });

    builder.Services.AddAuthorization();

    var app = builder.Build();

    app.UseSerilogRequestLogging();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
    }

    app.UseMiddleware<MrSiam.Api.Middleware.ExceptionHandlingMiddleware>();

    app.UseCors("Frontend");
    app.UseDefaultFiles();
    app.UseStaticFiles();

    var uploadsDir = Path.Combine(builder.Environment.ContentRootPath, "app_data", "top-students");
    Directory.CreateDirectory(uploadsDir);
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(uploadsDir),
        RequestPath = "/uploads/top-students"
    });
    var testimonialUploadsDir = Path.Combine(builder.Environment.ContentRootPath, "app_data", "testimonials");
    Directory.CreateDirectory(testimonialUploadsDir);
    app.UseStaticFiles(new StaticFileOptions { FileProvider = new PhysicalFileProvider(testimonialUploadsDir), RequestPath = "/uploads/testimonials" });
    var resourcesUploadsDir = Path.Combine(builder.Environment.ContentRootPath, "app_data", "resources");
    Directory.CreateDirectory(resourcesUploadsDir);
    app.UseStaticFiles(new StaticFileOptions { FileProvider = new PhysicalFileProvider(resourcesUploadsDir), RequestPath = "/uploads/resources" });
    var courseUploadsDir = Path.Combine(builder.Environment.ContentRootPath, "app_data", "courses");
    Directory.CreateDirectory(courseUploadsDir);
    app.UseStaticFiles(new StaticFileOptions { FileProvider = new PhysicalFileProvider(courseUploadsDir), RequestPath = "/uploads/courses" });
    var lessonUploadsDir = Path.Combine(builder.Environment.ContentRootPath, "app_data", "lessons");
    Directory.CreateDirectory(lessonUploadsDir);
    app.UseStaticFiles(new StaticFileOptions { FileProvider = new PhysicalFileProvider(lessonUploadsDir), RequestPath = "/uploads/lessons" });

    app.UseHttpsRedirection();
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapFallbackToFile("index.html");

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<MrSiam.Infrastructure.Persistence.AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<MrSiam.Application.Abstractions.IPasswordHasher>();
        db.Database.EnsureCreated();
        await MrSiam.Infrastructure.Persistence.SchemaBootstrap.EnsureCenterSchemaAsync(db);
        await MrSiam.Infrastructure.Persistence.SeedData.SeedAsync(db, hasher);
    }

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    await Log.CloseAndFlushAsync();
}
