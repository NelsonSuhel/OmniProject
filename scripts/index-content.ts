import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import faiss from 'faiss-node';

// Explicitly load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// DEBUG: Check if the environment variable is loaded
console.log('DATABASE_URL from process.env:', process.env.DATABASE_URL);

import { PrismaClient } from '../app/generated/prisma';
import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';

// Initialize Prisma Client with explicit database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Constants
const INDEX_PATH = path.resolve(process.cwd(), 'data/faiss.index');
const CONTENT_MAP_PATH = path.resolve(process.cwd(), 'data/lesson_content.json');
const EMBEDDING_DIM = 768; // Dimension for text-embedding-004

// Initialize Google Generative AI for embeddings
const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
if (!GOOGLE_GEMINI_API_KEY) {
  throw new Error('GOOGLE_GEMINI_API_KEY is not set in the environment variables');
}
const genAI = new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// Define a type for our JSON lesson fields for safety
type LessonText = { es?: string; en?: string };

// Define a type for our content map
type ContentMap = {
  [id: number]: {
    lessonId: string;
    courseId: string;
    courseTitle: string;
    lessonTitle: string;
    content: string;
  };
};

async function main() {
  console.log('Starting content indexing process with Faiss...');

  try {
    // 1. Fetch all lessons from the database
    console.log('Fetching lessons from the database...');
    const lessons = await prisma.lesson.findMany({
      where: { isPublished: true },
      include: { course: { select: { title: true } } },
    });

    if (lessons.length === 0) {
      console.log('No published lessons found to index.');
      return;
    }

    console.log(`Found ${lessons.length} lessons to process.`);

    // 2. Prepare documents for embedding and content map
    const documents: string[] = [];
    const contentMap: ContentMap = {};

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const titleJson = lesson.title as LessonText | null;
      const descriptionJson = lesson.description as LessonText | null;

      const title = titleJson?.es || titleJson?.en || 'Sin título';
      const description = descriptionJson?.es || descriptionJson?.en || 'Sin descripción';
      const courseTitle = lesson.course.title;

      const content = `Curso: ${courseTitle}\nLección: ${title}\nContenido: ${description}`;
      documents.push(content);
      contentMap[i] = { // Use the loop index as the Faiss ID
        lessonId: lesson.id,
        courseId: lesson.courseId,
        courseTitle: courseTitle,
        lessonTitle: title,
        content: content,
      };
    }

    // 3. Generate embeddings for all documents in a batch
    console.log('Generating embeddings for all documents... This may take a while.');
    const result = await embeddingModel.batchEmbedContents({
        requests: documents.map(doc => ({
            content: { role: 'user', parts: [{ text: doc }] },
            taskType: TaskType.RETRIEVAL_DOCUMENT
        }))
    });
    const embeddings = result.embeddings.map(e => e.values);

    if (embeddings.length !== documents.length) {
        throw new Error('Mismatch between number of documents and embeddings.');
    }

    // 4. Create and populate Faiss index
    console.log(`Creating Faiss index with dimension ${EMBEDDING_DIM}...`);
    const index = new faiss.IndexFlatL2(EMBEDDING_DIM);

    console.log('Adding embeddings to the index...');
    const flatEmbeddings = embeddings.flat();
    index.add(flatEmbeddings);

    // 5. Save the index and the content map to disk
    console.log(`Saving Faiss index to ${INDEX_PATH}...`);
    index.write(INDEX_PATH);

    console.log(`Saving content map to ${CONTENT_MAP_PATH}...`);
    fs.writeFileSync(CONTENT_MAP_PATH, JSON.stringify(contentMap, null, 2));

    console.log(`\nSuccessfully indexed ${index.ntotal} documents.`);

  } catch (error) {
    console.error('An error occurred during the indexing process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();