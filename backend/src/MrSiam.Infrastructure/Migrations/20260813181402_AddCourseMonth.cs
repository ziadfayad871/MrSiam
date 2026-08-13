using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MrSiam.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseMonth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Month",
                table: "Courses",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Month",
                table: "Courses");
        }
    }
}
