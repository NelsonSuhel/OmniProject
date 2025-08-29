'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Comment {
  id: string;
  content: string;
  translatedContent?: string; // Optional: Added for translated content
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
}

interface CommentsSectionProps {
  lessonId: string;
  currentLanguage: string; // Added: Pass current language from parent
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ lessonId, currentLanguage }) => {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOriginal, setShowOriginal] = useState<{ [key: string]: boolean }>({}); // State to toggle original/translated

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      // Pass currentLanguage to the API for translation
      const response = await fetch(`/api/lessons/${lessonId}/comments?lang=${currentLanguage}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments.');
      }
      const data = await response.json();
      setComments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (lessonId && currentLanguage) { // Fetch comments when lessonId or currentLanguage changes
      fetchComments();
    }
  }, [lessonId, currentLanguage]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post comment.');
      }

      const postedComment: Comment = await response.json();
      // Re-fetch comments to get the translated version from the backend
      fetchComments();
      setNewComment('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOriginal = (commentId: string) => {
    setShowOriginal(prevState => ({
      ...prevState,
      [commentId]: !prevState[commentId]
    }));
  };

  if (isLoading) {
    return <div className="text-center py-4">Cargando comentarios...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Comentarios</h2>

      <div className="space-y-4 mb-6">
        {comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <p className="font-bold text-gray-800">{comment.user.username}</p>
              <p className="text-gray-700 mt-1">
                {showOriginal[comment.id] && comment.translatedContent ? comment.content : (comment.translatedContent || comment.content)}
              </p>
              {comment.translatedContent && comment.translatedContent !== comment.content && (
                <button
                  onClick={() => toggleOriginal(comment.id)}
                  className="text-blue-500 text-sm mt-1 hover:underline focus:outline-none"
                >
                  {showOriginal[comment.id] ? 'Ver traducción' : 'Ver original'}
                </button>
              )}
              <p className="text-gray-500 text-xs mt-2">{new Date(comment.createdAt).toLocaleString()}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">Sé el primero en comentar esta lección.</p>
        )}
      </div>

      {status === 'authenticated' ? (
        <form onSubmit={handleSubmitComment} className="mt-4">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Escribe tu comentario aquí..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isSubmitting}
          ></textarea>
          <button
            type="submit"
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-blue-300"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Publicando...' : 'Publicar Comentario'}
          </button>
        </form>
      ) : (
        <p className="text-gray-600 mt-4">Inicia sesión para dejar un comentario.</p>
      )}
    </div>
  );
};

export default CommentsSection;