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
}
