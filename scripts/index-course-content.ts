// scripts/index-course-content.ts
import { PrismaClient } from '../app/generated/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IndexFlatL2 } from 'faiss-node';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const EMBEDDING_MODEL = "embedding-001";
const INDEX_PATH = path.resolve(process.cwd(), 'faiss_index.bin');
const DOCUMENTS_PATH = path.resolve(process.cwd(), 'indexed_documents.json');

interface Document {
  id: number; // Unique ID for the document, corresponding to its index in Faiss
  text: string;
  metadata: {
    courseId: string;
    lessonId: string;
    courseTitle: string;
    lessonTitle: string;
  };
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return [];
  }
}

async function indexCourseContent() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        lessons: true,
      },
    });

    const documents: Document[] = [];
    const embeddings: number[][] = [];

    let docId = 0;
    for (const course of courses) {
      for (const lesson of course.lessons) {
        // Assuming 'es' for Spanish content
        const lessonTitle = (lesson.title as any).es || lesson.title;
        const lessonDescription = (lesson.description as any)?.es || lesson.description;

        const content = `${lessonTitle}. ${lessonDescription || ''}`.trim();

        if (content) {
          const embedding = await generateEmbedding(content);
          if (embedding.length > 0) {
            documents.push({
              id: docId++,
              text: content,
              metadata: {
                courseId: course.id,
                lessonId: lesson.id,
                courseTitle: course.title,
                lessonTitle: lessonTitle,
              },
            });
            embeddings.push(embedding);
          }
        }
      }
    }

    if (documents.length === 0) {
      console.log("No documents to index.");
      return;
    }

    const dimension = embeddings[0].length;
    const index = new IndexFlatL2(dimension);

    // Flatten embeddings for Faiss
    const flatEmbeddings = new Float32Array(embeddings.flat());

    index.add(flatEmbeddings as any); // Cast to any to bypass type checking

    // Save the Faiss index
    index.write(INDEX_PATH);

    // Save the documents metadata
    fs.writeFileSync(DOCUMENTS_PATH, JSON.stringify(documents, null, 2));

    console.log(`Indexed ${documents.length} documents.`);
    console.log(`Faiss index saved to ${INDEX_PATH}`);
    console.log(`Document metadata saved to ${DOCUMENTS_PATH}`);

  } catch (error) {
    console.error("Error indexing course content:", error);
  } finally {
    await prisma.$disconnect();
  }
}

indexCourseContent();
