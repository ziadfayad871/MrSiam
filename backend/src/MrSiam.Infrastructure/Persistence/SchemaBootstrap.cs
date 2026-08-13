using Microsoft.EntityFrameworkCore;

namespace MrSiam.Infrastructure.Persistence;

public static class SchemaBootstrap
{
    public static async Task EnsureCenterSchemaAsync(AppDbContext db)
    {
        var isSqlServer = db.Database.ProviderName?.Contains("SqlServer", StringComparison.OrdinalIgnoreCase) == true;

        await EnsureTableAsync(db, "StudyGroups", isSqlServer, StudyGroupsSql);
        await EnsureTableAsync(db, "StudyGroupMembers", isSqlServer, StudyGroupMembersSql);
        await EnsureTableAsync(db, "ScheduleSlots", isSqlServer, ScheduleSlotsSql);
        await EnsureTableAsync(db, "AuditLogs", isSqlServer, AuditLogsSql);
        await EnsureTableAsync(db, "StudentTestimonials", isSqlServer, TestimonialsSql);
        await EnsureTableAsync(db, "Assignments", isSqlServer, AssignmentsSql);
        await EnsureTableAsync(db, "LessonResources", isSqlServer, LessonResourcesSql);
        await EnsureColumnAsync(db, "Assignments", "LessonId", isSqlServer);
        await EnsureColumnAsync(db, "Courses", "ImageUrl", isSqlServer, "nvarchar(400)");
        await EnsureColumnAsync(db, "Lessons", "ImageUrl", isSqlServer, "nvarchar(400)");
    }

    private static async Task EnsureTableAsync(AppDbContext db, string tableName, bool isSqlServer, Func<bool, string> sql)
    {
        var exists = await TableExistsAsync(db, tableName, isSqlServer);
        if (exists) return;

        await db.Database.ExecuteSqlRawAsync(sql(isSqlServer));
    }

    private static async Task<bool> TableExistsAsync(AppDbContext db, string tableName, bool isSqlServer)
    {
        var conn = db.Database.GetDbConnection();
        await conn.OpenAsync();

        try
        {
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = isSqlServer
                ? $"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='{tableName}'"
                : $"SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='{tableName}'";

            var result = await cmd.ExecuteScalarAsync();
            return result is not null && Convert.ToInt32(result) > 0;
        }
        finally
        {
            await conn.CloseAsync();
        }
    }

    private static async Task EnsureColumnAsync(AppDbContext db, string tableName, string columnName, bool isSqlServer, string sqlServerType = "int")
    {
        var exists = await ColumnExistsAsync(db, tableName, columnName, isSqlServer);
        if (exists) return;

        var ddl = isSqlServer
            ? $"ALTER TABLE [{tableName}] ADD [{columnName}] {sqlServerType} NULL"
            : $"ALTER TABLE {tableName} ADD COLUMN {columnName} TEXT NULL";
        await db.Database.ExecuteSqlRawAsync(ddl);
    }

    private static async Task<bool> ColumnExistsAsync(AppDbContext db, string tableName, string columnName, bool isSqlServer)
    {
        var conn = db.Database.GetDbConnection();
        await conn.OpenAsync();

        try
        {
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = isSqlServer
                ? $"SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='{tableName}' AND COLUMN_NAME='{columnName}'"
                : $"SELECT COUNT(*) FROM pragma_table_info('{tableName}') WHERE name='{columnName}'";

            var result = await cmd.ExecuteScalarAsync();
            return result is not null && Convert.ToInt32(result) > 0;
        }
        finally
        {
            await conn.CloseAsync();
        }
    }

    private static string StudyGroupsSql(bool sqlServer) =>
        sqlServer
            ? "CREATE TABLE [StudyGroups] ([Id] int NOT NULL IDENTITY(1,1) PRIMARY KEY, [Name] nvarchar(120) NOT NULL, [Stage] int NOT NULL, [AcademicYear] nvarchar(16) NOT NULL, [IsActive] bit NOT NULL, [CreatedAt] datetime2 NOT NULL)"
            : "CREATE TABLE StudyGroups (Id INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT NOT NULL, Stage INTEGER NOT NULL, AcademicYear TEXT NOT NULL, IsActive INTEGER NOT NULL, CreatedAt TEXT NOT NULL)";

    private static string StudyGroupMembersSql(bool sqlServer) =>
        sqlServer
            ? "CREATE TABLE [StudyGroupMembers] ([Id] int NOT NULL IDENTITY(1,1) PRIMARY KEY, [GroupId] int NOT NULL, [StudentId] int NOT NULL, [AddedAt] datetime2 NOT NULL)"
            : "CREATE TABLE StudyGroupMembers (Id INTEGER PRIMARY KEY AUTOINCREMENT, GroupId INTEGER NOT NULL, StudentId INTEGER NOT NULL, AddedAt TEXT NOT NULL)";

    private static string ScheduleSlotsSql(bool sqlServer) =>
        sqlServer
            ? "CREATE TABLE [ScheduleSlots] ([Id] int NOT NULL IDENTITY(1,1) PRIMARY KEY, [GroupId] int NOT NULL, [Day] int NOT NULL, [StartTime] time NOT NULL, [EndTime] time NOT NULL, [Subject] nvarchar(80) NULL, [Room] nvarchar(60) NULL)"
            : "CREATE TABLE ScheduleSlots (Id INTEGER PRIMARY KEY AUTOINCREMENT, GroupId INTEGER NOT NULL, Day INTEGER NOT NULL, StartTime TEXT NOT NULL, EndTime TEXT NOT NULL, Subject TEXT NULL, Room TEXT NULL)";

    private static string TestimonialsSql(bool sqlServer) =>
        sqlServer
            ? "CREATE TABLE [StudentTestimonials] ([Id] int NOT NULL IDENTITY(1,1) PRIMARY KEY, [FullName] nvarchar(120) NOT NULL DEFAULT '', [Quote] nvarchar(1000) NOT NULL DEFAULT '', [StageAr] nvarchar(60) NULL, [PhotoUrl] nvarchar(300) NULL, [CreatedAt] datetime2 NOT NULL)"
            : "CREATE TABLE StudentTestimonials (Id INTEGER PRIMARY KEY AUTOINCREMENT, FullName TEXT NOT NULL DEFAULT '', Quote TEXT NOT NULL DEFAULT '', StageAr TEXT NULL, PhotoUrl TEXT NULL, CreatedAt TEXT NOT NULL)";

    private static string AssignmentsSql(bool sqlServer) =>
        sqlServer
            ? "CREATE TABLE [Assignments] ([Id] int NOT NULL IDENTITY(1,1) PRIMARY KEY, [CourseId] int NOT NULL, [LessonId] int NULL, [Title] nvarchar(160) NOT NULL, [Description] nvarchar(max) NOT NULL, [DueDate] datetime2 NULL, [CreatedAt] datetime2 NOT NULL)"
            : "CREATE TABLE Assignments (Id INTEGER PRIMARY KEY AUTOINCREMENT, CourseId INTEGER NOT NULL, LessonId INTEGER NULL, Title TEXT NOT NULL, Description TEXT NOT NULL, DueDate TEXT NULL, CreatedAt TEXT NOT NULL)";

    private static string LessonResourcesSql(bool sqlServer) =>
        sqlServer
            ? "CREATE TABLE [LessonResources] ([Id] int NOT NULL IDENTITY(1,1) PRIMARY KEY, [LessonId] int NOT NULL, [Title] nvarchar(200) NOT NULL, [Kind] nvarchar(30) NOT NULL, [FileUrl] nvarchar(400) NOT NULL, [CreatedAt] datetime2 NOT NULL)"
            : "CREATE TABLE LessonResources (Id INTEGER PRIMARY KEY AUTOINCREMENT, LessonId INTEGER NOT NULL, Title TEXT NOT NULL, Kind TEXT NOT NULL, FileUrl TEXT NOT NULL, CreatedAt TEXT NOT NULL)";

    private static string AuditLogsSql(bool sqlServer) =>
        sqlServer
            ? "CREATE TABLE [AuditLogs] ([Id] int NOT NULL IDENTITY(1,1) PRIMARY KEY, [UserId] int NULL, [Username] nvarchar(64) NULL, [Action] nvarchar(60) NOT NULL, [Entity] nvarchar(60) NOT NULL, [EntityId] nvarchar(40) NULL, [Details] nvarchar(max) NULL, [IpAddress] nvarchar(45) NULL, [CreatedAt] datetime2 NOT NULL)"
            : "CREATE TABLE AuditLogs (Id INTEGER PRIMARY KEY AUTOINCREMENT, UserId INTEGER NULL, Username TEXT NULL, Action TEXT NOT NULL, Entity TEXT NOT NULL, EntityId TEXT NULL, Details TEXT NULL, IpAddress TEXT NULL, CreatedAt TEXT NOT NULL)";
}
