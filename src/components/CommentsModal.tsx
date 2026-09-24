import React, { useState } from 'react';
import { X, Send, Trash2 } from 'lucide-react';
import { Post, Comment } from '../types';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

interface CommentsModalProps {
  post: Post | null;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ post, onClose, onCommentAdded }) => {
  const { profile } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>(post?.comments || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !profile) return;

    setIsSubmitting(true);
    try {
      const newComment = await supabaseService.addComment(post.id, profile.id, commentText.trim(), profile);
      setComments([...comments, newComment]);
      setCommentText('');
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      console.error('Error al agregar comentario:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await supabaseService.deleteComment(commentId, post.id);
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Error al eliminar comentario:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Comentarios</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de comentarios */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No hay comentarios aún. ¡Sé el primero en comentar!
            </div>
          ) : (
            comments.map((comment) => {
              const isMine = comment.user_id === profile?.id;
              const authorName = comment.autor?.nombre || 'Usuario';
              const initials = authorName.slice(0, 2).toUpperCase();

              return (
                <div key={comment.id} className="flex items-start gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{authorName}</span>
                        {comment.autor?.rol && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded capitalize">
                            {comment.autor.rol}
                          </span>
                        )}
                      </div>
                      {isMine && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                          title="Eliminar comentario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-700">{comment.contenido}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input para agregar comentario */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 flex items-center gap-2 bg-slate-50/50">
          <input
            type="text"
            placeholder="Escribe un comentario respetuoso..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!commentText.trim() || isSubmitting}
            className="bg-[#10B981] hover:bg-emerald-600 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
