'use client';

import { useEffect, useState } from 'react';
import { supabase, Post, Comment } from '@/lib/supabase';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';

interface NewsfeedProps {
  refreshTrigger?: number;
}

export default function Newsfeed({ refreshTrigger = 0 }: NewsfeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [animatingLikes, setAnimatingLikes] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'latest' | 'likes'>('latest');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [visibleComments, setVisibleComments] = useState<Set<string>>(new Set());

  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase.from('posts').select('*');

      if (sortBy === 'likes') {
        query = query.order('likes', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setPosts(data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load posts';
      setError(errorMessage);
      console.error('Fetch posts error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [refreshTrigger, sortBy]);

  // Check for admin mode
  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    setIsAdminMode(params.get('admin_mode') === 'true');
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = supabase
      .channel('posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (deleteError) {
        throw deleteError;
      }

      // Remove post from local state
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete post');
    }
  };

  const handleAddComment = async (postId: string) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    try {
      const newComment: Comment = {
        id: Date.now().toString(),
        content: commentText,
        created_at: new Date().toISOString(),
      };

      // Get the current post
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const updatedComments = [...(post.comments || []), newComment];

      // Update post with new comments
      const { error: updateError } = await supabase
        .from('posts')
        .update({ comments: updatedComments })
        .eq('id', postId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { ...p, comments: updatedComments } : p
        )
      );

      // Clear input
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error('Add comment error:', err);
      alert('Failed to add comment');
    }
  };

  const toggleComments = (postId: string) => {
    setVisibleComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const handleLike = async (postId: string, currentLikes: number) => {
    try {
      setAnimatingLikes((prev) => new Set(prev).add(postId));
      const newLikesCount = currentLikes + 1;

      const { error: updateError } = await supabase
        .from('posts')
        .update({ likes: newLikesCount })
        .eq('id', postId);

      if (updateError) {
        throw updateError;
      }

      // Update posts list
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, likes: newLikesCount } : post
        )
      );

      // Remove animation after 600ms
      setTimeout(() => {
        setAnimatingLikes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }, 600);
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-red-100 text-red-700 p-4 rounded-lg">
        Error: {error}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500 text-sm sm:text-base">
          No posts yet. Be the first to share something!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Sort Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSortBy('latest')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer font-medium ${
            sortBy === 'latest'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Latest
        </button>
        <button
          onClick={() => setSortBy('likes')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer font-medium ${
            sortBy === 'likes'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Most Liked
        </button>
      </div>
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow"
        >
          {/* Post Header */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b">
            <div className="flex-1 min-w-0">
              <p className="text-gray-500 text-xs sm:text-sm">
                {formatDate(post.created_at)}
              </p>
            </div>
            {isAdminMode && (
              <button
                onClick={() => handleDelete(post.id)}
                className="cursor-pointer text-red-500 hover:text-red-700 transition-colors text-sm font-medium"
              >
                Delete
              </button>
            )}
          </div>

          {/* Post Content */}
          <div className="mt-4 text-sm sm:text-base text-gray-800 prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                p: ({node, ...props}) => <p className="mb-2" {...props} />,
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-2 mt-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-2 mt-3" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-2 mt-2" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2" {...props} />,
                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-2" {...props} />,
                a: ({node, ...props}) => <a className="text-blue-500 hover:underline" {...props} />,
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Images Grid */}
          {post.image_urls && post.image_urls.length > 0 && (
            <div
              className={`mt-4 grid gap-2 ${
                post.image_urls.length === 1
                  ? 'grid-cols-2 sm:grid-cols-3'
                  : post.image_urls.length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-2 sm:grid-cols-3'
              }`}
            >
              {post.image_urls.map((imageUrl, index) => (
                <div
                  key={index}
                  className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-200 cursor-pointer"
                  onClick={() => setSelectedImage(imageUrl)}
                >
                  <Image
                    src={imageUrl}
                    alt={`Post image ${index}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Post Footer */}
          <div className="mt-4 flex gap-4 text-gray-500 text-xs sm:text-sm">
            <button
              onClick={() => handleLike(post.id, post.likes || 0)}
              className={`cursor-pointer flex items-center gap-1 transition-all duration-300 text-red-500 hover:scale-110 ${
                animatingLikes.has(post.id) ? 'scale-110' : ''
              }`}
            >
              <span
                className={`text-lg transition-transform duration-300 ${
                  animatingLikes.has(post.id) ? 'scale-125' : ''
                }`}
              >
                ❤️
              </span>
              <span>{post.likes || 0}</span>
            </button>
            <button
              onClick={() => toggleComments(post.id)}
              className="cursor-pointer hover:text-blue-500 flex items-center gap-1 transition-colors"
            >
              💬 {post.comments?.length || 0}
            </button>
          </div>

          {/* Comments Section */}
          {visibleComments.has(post.id) && (
            <div className="mt-4 pt-4 border-t space-y-3">
              {/* Existing Comments */}
              {post.comments && post.comments.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 p-2 rounded text-xs sm:text-sm">
                      <p className="text-gray-800 break-words">{comment.content}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {formatDate(comment.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Input */}
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={commentInputs[post.id] || ''}
                  onChange={(e) =>
                    setCommentInputs((prev) => ({
                      ...prev,
                      [post.id]: e.target.value,
                    }))
                  }
                  placeholder="Add a comment..."
                  className="flex-1 px-2 py-1 border rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddComment(post.id);
                    }
                  }}
                />
                <button
                  onClick={() => handleAddComment(post.id)}
                  className="cursor-pointer px-3 py-1 bg-blue-500 text-white rounded text-xs sm:text-sm hover:bg-blue-600 transition-colors"
                >
                  Post
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Image Popup Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full h-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage}
              alt="Enlarged image"
              width={800}
              height={800}
              className="w-full h-full object-contain rounded-lg"
              priority
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white rounded-full w-10 h-10 flex items-center justify-center text-2xl cursor-pointer hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
