# Newsfeed App - Setup Guide

A mobile-first newsfeed application built with Next.js, React, Tailwind CSS, and Supabase.

## Features

✅ **Mobile-First Design** - Responsive UI that works beautifully on all devices
✅ **Create Posts** - Share text posts with images (up to 5 per post)
✅ **Newsfeed** - View all posts from all users in chronological order
✅ **Real-time Updates** - Posts update in real-time using Supabase subscriptions
✅ **Image Support** - Upload and store images in Supabase Storage
✅ **User System** - Demo user system with localStorage persistence

## Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase account (free tier available at https://supabase.com)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

Dependencies installed:
- `@supabase/supabase-js` - Supabase client library
- Next.js 16.1.1
- React 19.2.3
- Tailwind CSS 4
- TypeScript 5

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to initialize
4. Go to **Project Settings** → **API**
5. Copy your **Project URL** and **anon public key**

### 3. Configure Environment Variables

Edit `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Create Database Schema

In your Supabase dashboard:

1. Go to **SQL Editor**
2. Create a new query
3. Copy and paste all SQL commands from `DATABASE_SETUP.md`
4. Execute each section sequentially

#### Tables created:
- **users** - Store user information
- **posts** - Store post content and metadata

#### Storage bucket created:
- **post-images** - Store post images (must be public)

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── components/
│   ├── CreatePost.tsx      # Post creation form
│   └── Newsfeed.tsx        # Posts feed display
├── page.tsx                 # Home page
├── layout.tsx               # Root layout
└── globals.css             # Global styles
lib/
├── supabase.ts             # Supabase client & types
.env.local                  # Environment variables
DATABASE_SETUP.md           # Database schema SQL
```

## How It Works

### Create Post Flow
1. User enters text content
2. User optionally selects images (max 5)
3. Images are uploaded to Supabase Storage
4. Post record created in database with image URLs
5. Newsfeed automatically refreshes

### Newsfeed Flow
1. Fetches all posts ordered by creation date (newest first)
2. Displays user avatar, name, timestamp, content, and images
3. Listens to real-time database changes
4. Updates automatically when new posts are created

## Component Details

### CreatePost Component
- Text area for post content
- Image uploader with preview
- Image removal functionality
- Loading state
- Error handling
- Responsive button layout

### Newsfeed Component
- Real-time post fetching
- Loading skeleton
- Empty state message
- Responsive image grid (1-4 columns)
- Time formatting (just now, 5m ago, etc.)
- Real-time subscriptions

## Styling

- **Tailwind CSS 4** for utility-first styling
- **Mobile-first approach** - base styles for mobile, breakpoints for larger screens
- **Responsive breakpoints**:
  - Default: Mobile (< 640px)
  - `sm:` - 640px and up
  - `md:` - 768px and up
  - `lg:` - 1024px and up

## Features Explained

### User System
Currently uses a demo user system with localStorage:
- Generates a random username on first visit
- Persists user ID across sessions
- Ready to integrate with real authentication (Auth0, NextAuth.js, etc.)

### Image Handling
- Maximum 5 images per post
- Images stored in Supabase Storage
- Public URLs returned for display
- Optimized with Next.js Image component

### Real-time Updates
- Uses Supabase PostgreSQL subscriptions
- Automatically refreshes newsfeed when posts are added
- Listen to insert, update, and delete events

## Customization

### Change Max Images Per Post
Edit `CreatePost.tsx`, line 35:
```tsx
const newImages = [...images, ...files].slice(0, 5); // Change 5 to desired number
```

### Change Post Limit Per Page
Edit `Newsfeed.tsx`, modify the query:
```tsx
.limit(20) // Add this to limit posts
```

### Customize Colors
Edit component className strings or `globals.css`:
- Primary color: `blue-500` → change to `purple-500`, `green-500`, etc.
- Background: `gray-100` → adjust as needed

### Add Authentication
Replace the localStorage user system in `page.tsx` with:
- NextAuth.js
- Auth0
- Supabase Auth
- Firebase Auth

## Troubleshooting

### Issue: "Public schema not found"
**Solution**: Run DATABASE_SETUP.md SQL commands in your Supabase dashboard

### Issue: Images not uploading
**Solution**: 
1. Check that `post-images` bucket exists and is public
2. Verify Supabase credentials in `.env.local`
3. Check browser console for specific error messages

### Issue: Posts not appearing
**Solution**:
1. Verify database tables were created
2. Check that `.env.local` has correct Supabase URL and key
3. Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Issue: Real-time updates not working
**Solution**:
1. Verify row-level security (RLS) policies are created
2. Check database connection in browser console
3. Ensure `posts` table has RLS enabled

## Next Steps

1. **Add Authentication** - Implement proper user authentication
2. **Add Comments** - Allow users to comment on posts
3. **Add Likes** - Implement post likes/reactions
4. **Add User Profiles** - Create profile pages with user posts
5. **Add Search** - Search posts by keywords
6. **Add Notifications** - Notify users of new interactions
7. **Add Moderation** - Delete inappropriate posts
8. **Optimize Performance** - Add pagination and lazy loading

## Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

### Deploy to Other Platforms

- **Netlify**: Similar process to Vercel
- **Railway**: Push to GitHub, connect repository
- **Docker**: Build with `npm run build`, deploy container

## Support

For issues with:
- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev/
- **Supabase**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

## License

This project is open source and available under the MIT License.
