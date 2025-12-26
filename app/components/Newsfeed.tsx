'use client';

import { useEffect, useState } from 'react';
import { supabase, Post } from '@/lib/supabase';
import Image from 'next/image';

interface NewsfeedProps {
  refreshTrigger?: number;
}

export default function Newsfeed({ refreshTrigger = 0 }: NewsfeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

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
  }, [refreshTrigger]);

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

  console.log('Posts:', posts);

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
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow"
        >
          {/* Post Header */}
          <div className="flex items-center gap-3 pb-4 border-b">
            <div className="flex-1 min-w-0">
              <p className="text-gray-500 text-xs sm:text-sm">
                {formatDate(post.created_at)}
              </p>
            </div>
          </div>

          {/* Post Content */}
          <p className="mt-4 text-sm sm:text-base text-gray-800 whitespace-pre-wrap break-words">
            {post.content}
          </p>

          {/* Images Grid */}
          {post.image_urls && post.image_urls.length > 0 && (
            <div
              className={`mt-4 grid gap-2 ${
                post.image_urls.length === 1
                  ? 'grid-cols-1'
                  : post.image_urls.length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-2 sm:grid-cols-3'
              }`}
            >
              {post.image_urls.map((imageUrl, index) => (
                <div
                  key={index}
                  className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-200"
                >
                  <Image
                    src={imageUrl}
                    alt={`Post image ${index}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform cursor-pointer"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Post Footer */}
          <div className="mt-4 flex gap-4 text-gray-500 text-xs sm:text-sm">
            <button className="hover:text-blue-500 flex items-center gap-1 transition-colors">
              ❤️ Like
            </button>
            <button className="hover:text-blue-500 flex items-center gap-1 transition-colors">
              💬 Comment
            </button>
            <button className="hover:text-blue-500 flex items-center gap-1 transition-colors">
              🔄 Share
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
