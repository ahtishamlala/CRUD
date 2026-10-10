using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Student> Students => Set<Student>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Seed initial sample data
            modelBuilder.Entity<Student>().HasData(
                new Student
                {
                    Id = 1,
                    Name = "Muhammad Ali",
                    Email = "ali@example.com",
                    Department = "Computer Science",
                    Phone = "+92 300 1234567",
                    EnrollmentDate = new DateTime(2024, 1, 15)
                },
                new Student
                {
                    Id = 2,
                    Name = "Sara Khan",
                    Email = "sara.khan@example.com",
                    Department = "Software Engineering",
                    Phone = "+92 312 9876543",
                    EnrollmentDate = new DateTime(2024, 2, 20)
                },
                new Student
                {
                    Id = 3,
                    Name = "Hamza Ahmed",
                    Email = "hamza@example.com",
                    Department = "Information Technology",
                    Phone = "+92 333 4567890",
                    EnrollmentDate = new DateTime(2024, 3, 10)
                }
            );
        }
    }
}
