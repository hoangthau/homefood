'use client';

import { useState, useEffect } from 'react';
import CreatePost from './components/CreatePost';
import Newsfeed from './components/Newsfeed';

interface User {
  id: string;
  username: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initialize user (in a real app, this would be from authentication)
    const initializeUser = async () => {
      try {
        // Check if user exists in localStorage
        let currentUser = localStorage.getItem('currentUser');
        
        if (!currentUser) {
          // Generate a demo user with UUID format
          const demoUsername = `User${Math.floor(Math.random() * 10000)}`;
          // Generate a v4-like UUID (simple implementation)
          const demoUserId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
          currentUser = JSON.stringify({ id: demoUserId, username: demoUsername });
          localStorage.setItem('currentUser', currentUser);
        }
        
        setUser(JSON.parse(currentUser));
      } catch (error) {
        console.error('Error initializing user:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeUser();
  }, []);

  const handlePostCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error initializing user</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b flex justify-center">
        <div className="max-w-3xl w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              📰 Homefood
            </h1>
            
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 w-full flex justify-center">
        <div className="max-w-3xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Create Post Section */}
          <CreatePost
            onPostCreated={handlePostCreated}
          />

          {/* Newsfeed Section */}
          <Newsfeed refreshTrigger={refreshTrigger} />
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-white border-t mt-8">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-500 text-xs sm:text-sm">
          <p>© 2025 Newsfeed App. Built with Next.js and Supabase.</p>
        </div>
      </footer>
    </main>
  );
}
