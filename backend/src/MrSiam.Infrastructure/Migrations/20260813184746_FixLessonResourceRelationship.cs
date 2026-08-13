using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MrSiam.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixLessonResourceRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LessonResources_Lessons_LessonId1",
                table: "LessonResources");

            migrationBuilder.DropIndex(
                name: "IX_LessonResources_LessonId1",
                table: "LessonResources");

            migrationBuilder.DropColumn(
                name: "LessonId1",
                table: "LessonResources");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LessonId1",
                table: "LessonResources",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_LessonResources_LessonId1",
                table: "LessonResources",
                column: "LessonId1");

            migrationBuilder.AddForeignKey(
                name: "FK_LessonResources_Lessons_LessonId1",
                table: "LessonResources",
                column: "LessonId1",
                principalTable: "Lessons",
                principalColumn: "Id");
        }
    }
}
