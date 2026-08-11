IF OBJECT_ID(N'dbo.SubscriptionPlans', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[SubscriptionPlans] (
        [Id] int IDENTITY(1,1) NOT NULL,
        [Name] nvarchar(120) NOT NULL,
        [Months] int NOT NULL,
        [Price] decimal(18,2) NOT NULL,
        [Description] nvarchar(400) NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_SubscriptionPlans] PRIMARY KEY ([Id])
    );
END;

IF OBJECT_ID(N'dbo.Coupons', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Coupons] (
        [Id] int IDENTITY(1,1) NOT NULL,
        [Code] nvarchar(40) NOT NULL,
        [DiscountPercent] int NOT NULL,
        [MaxUses] int NOT NULL,
        [UsedCount] int NOT NULL,
        [ExpiresAt] datetime2 NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_Coupons] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_Coupons_Code] ON [dbo].[Coupons] ([Code]);
END;

IF OBJECT_ID(N'dbo.Subscriptions', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Subscriptions] (
        [Id] int IDENTITY(1,1) NOT NULL,
        [StudentId] int NOT NULL,
        [PlanId] int NOT NULL,
        [CouponId] int NULL,
        [AmountPaid] decimal(18,2) NOT NULL,
        [StartsAt] datetime2 NOT NULL,
        [EndsAt] datetime2 NOT NULL,
        [Status] int NOT NULL,
        CONSTRAINT [PK_Subscriptions] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_Subscriptions_StudentId_Status] ON [dbo].[Subscriptions] ([StudentId], [Status]);
    ALTER TABLE [dbo].[Subscriptions] ADD CONSTRAINT [FK_Subscriptions_Students_StudentId] FOREIGN KEY ([StudentId]) REFERENCES [dbo].[Students] ([Id]) ON DELETE CASCADE;
    ALTER TABLE [dbo].[Subscriptions] ADD CONSTRAINT [FK_Subscriptions_SubscriptionPlans_PlanId] FOREIGN KEY ([PlanId]) REFERENCES [dbo].[SubscriptionPlans] ([Id]) ON DELETE NO ACTION;
    ALTER TABLE [dbo].[Subscriptions] ADD CONSTRAINT [FK_Subscriptions_Coupons_CouponId] FOREIGN KEY ([CouponId]) REFERENCES [dbo].[Coupons] ([Id]) ON DELETE NO ACTION;
END;

IF OBJECT_ID(N'dbo.Parents', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Parents] (
        [Id] int IDENTITY(1,1) NOT NULL,
        [UserId] int NOT NULL,
        [FullName] nvarchar(120) NOT NULL,
        [Phone] nvarchar(24) NULL,
        CONSTRAINT [PK_Parents] PRIMARY KEY ([Id])
    );
    ALTER TABLE [dbo].[Parents] ADD CONSTRAINT [FK_Parents_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE NO ACTION;
END;

IF COL_LENGTH(N'dbo.Students', N'ParentId') IS NULL
BEGIN
    ALTER TABLE [dbo].[Students] ADD [ParentId] int NULL;
    ALTER TABLE [dbo].[Students] ADD CONSTRAINT [FK_Students_Parents_ParentId] FOREIGN KEY ([ParentId]) REFERENCES [dbo].[Parents] ([Id]) ON DELETE NO ACTION;
END;

IF OBJECT_ID(N'dbo.LiveLessons', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[LiveLessons] (
        [Id] int IDENTITY(1,1) NOT NULL,
        [CourseId] int NULL,
        [Title] nvarchar(200) NOT NULL,
        [Description] nvarchar(600) NULL,
        [ScheduledAt] datetime2 NOT NULL,
        [DurationMinutes] int NOT NULL,
        [MeetUrl] nvarchar(400) NULL,
        [IsCancelled] bit NOT NULL,
        CONSTRAINT [PK_LiveLessons] PRIMARY KEY ([Id])
    );
    ALTER TABLE [dbo].[LiveLessons] ADD CONSTRAINT [FK_LiveLessons_Courses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [dbo].[Courses] ([Id]) ON DELETE NO ACTION;
END;
