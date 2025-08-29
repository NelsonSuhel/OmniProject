"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const promises_1 = require("fs/promises");
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
// Helper function to create a slug from a title, now handles accents
const titleToSlug = (title) => {
    const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;';
    const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------';
    const p = new RegExp(a.split('').join('|'), 'g');
    return title.toString().toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
        .replace(/&/g, '-and-') // Replace & with 'and'
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
};
async function populateLessonContent() {
    try {
        console.log('Iniciando el script para poblar el contenido de las lecciones...');
        const courses = await prisma.course.findMany({
            include: {
                lessons: true,
            },
        });
        for (const course of courses) {
            const courseSlug = titleToSlug(course.title);
            console.log(`Procesando curso: ${course.title} (Slug: ${courseSlug})`);
            const coursePath = path.join(process.cwd(), 'data', 'courses', courseSlug);
            for (const lesson of course.lessons) {
                const lessonTitle = typeof lesson.title === 'string' ? lesson.title : lesson.title?.es || '';
                if (!lessonTitle)
                    continue;
                const lessonSlug = `${String(lesson.position).padStart(2, '0')}-${titleToSlug(lessonTitle)}.md`;
                const moduleDir = `module${Math.floor((lesson.position - 1) / 10)}`;
                const markdownFilePath = path.join(coursePath, moduleDir, lessonSlug);
                try {
                    await (0, promises_1.access)(markdownFilePath);
                    const markdownContent = await (0, promises_1.readFile)(markdownFilePath, 'utf-8');
                    await prisma.lesson.update({
                        where: { id: lesson.id },
                        data: { content: markdownContent },
                    });
                    console.log(`  > Contenido actualizado para la lección: ${lessonTitle}`);
                }
                catch (error) {
                    if (error.code === 'ENOENT') {
                        console.warn(`  > ADVERTENCIA: No se encontró el archivo Markdown para la lección '${lessonTitle}' en la ruta: ${markdownFilePath}`);
                    }
                    else {
                        console.error(`  > Error al procesar el archivo para la lección '${lessonTitle}':`, error);
                    }
                }
            }
        }
        console.log('Script de poblamiento de contenido finalizado.');
    }
    catch (error) {
        console.error('Error general en el script:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
populateLessonContent();
