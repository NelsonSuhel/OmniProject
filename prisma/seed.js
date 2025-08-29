"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const courses_data_1 = require("../app/data/courses.data");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log(`Start seeding ...`);
    // Create a default user
    const hashedPassword = await bcryptjs_1.default.hash('password123', 12);
    const user = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            username: 'admin',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });
    console.log(`Created/updated user: ${user.username}`);
    // Create categories
    const categoryNames = [...new Set(courses_data_1.courses.map(c => c.category))];
    for (const name of categoryNames) {
        await prisma.category.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
    console.log(`Created/updated ${categoryNames.length} categories.`);
    // Create courses and lessons
    for (const courseData of courses_data_1.courses) {
        const category = await prisma.category.findUnique({ where: { name: courseData.category } });
        if (!category) {
            console.warn(`Category not found for course: ${courseData.title}. Skipping.`);
            continue;
        }
        const course = await prisma.course.upsert({
            where: { title: courseData.title }, // Assuming title is unique
            update: {},
            create: {
                title: courseData.title,
                imageUrl: `/images/course-placeholder.png`, // Add a placeholder image
                price: Math.floor(Math.random() * 100) + 20, // Random price for now
                isPublished: true,
                categoryId: category.id,
                userId: user.id,
                tags: courseData.keywords || [],
                targetAudience: courseData.targetAudience,
                learningObjectives: courseData.learningObjectives ? { objectives: courseData.learningObjectives } : undefined,
                prerequisites: courseData.prerequisites ? { items: courseData.prerequisites } : undefined,
            },
        });
        console.log(`Created/updated course: ${course.title}`);
        if (courseData.modules) {
            for (let i = 0; i < courseData.modules.length; i++) {
                const module = courseData.modules[i];
                await prisma.lesson.upsert({
                    where: { courseId_position: { courseId: course.id, position: i + 1 } },
                    update: {},
                    create: {
                        title: { es: module.title, en: module.title },
                        description: { es: module.description, en: module.description },
                        position: i + 1,
                        isPublished: true,
                        courseId: course.id,
                    },
                });
            }
            console.log(`  - Created ${courseData.modules.length} lessons for ${course.title}`);
        }
    }
    console.log(`Seeding finished.`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
