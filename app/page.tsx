'use client';

import { useState } from 'react';
import CreatePost from './components/CreatePost';
import Newsfeed from './components/Newsfeed';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePostCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <main className="flex min-h-screen w-full flex-col bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b flex justify-center">
        <div className="max-w-3xl w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              🍲 Homefood
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
          <p>© 2025 Homefood App. Built by Foodie buddy.</p>
        </div>
      </footer>
    </main>
  );
}
