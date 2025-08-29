export interface QuizQuestion {
  id: string;
  question: string;
  options?: string[];
  correctAnswer: string | string[] | boolean;
  type: 'single-choice' | 'multiple-select' | 'true-false';
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

export const quizzes: Quiz[] = [
  {
    id: 'alturas-modulo-1',
    title: 'Cuestionario del Módulo 1 de Trabajo en Alturas',
    questions: [
      {
        id: 'q1',
        question: '¿Cuál de las siguientes es considerada la medida de control más efectiva en la jerarquía de controles?',
        options: [
          'Uso de Equipo de Protección Personal (EPP)',
          'Controles Administrativos',
          'Eliminación del Peligro',
          'Sustitución'
        ],
        correctAnswer: 'Eliminación del Peligro',
        type: 'single-choice',
      },
      {
        id: 'q2',
        question: 'Selecciona todos los componentes que forman parte de un Sistema Personal de Detención de Caídas (SPDC).',
        options: [
          'Arnés de cuerpo completo',
          'Línea de vida',
          'Punto de anclaje',
          'Casco de seguridad'
        ],
        correctAnswer: ['Arnés de cuerpo completo', 'Línea de vida', 'Punto de anclaje'],
        type: 'multiple-select',
      },
      {
        id: 'q3',
        question: 'Verdadero o Falso: Una inspección visual del arnés de seguridad es suficiente y no requiere ser documentada.',
        correctAnswer: false,
        type: 'true-false',
      },
    ],
  },
];