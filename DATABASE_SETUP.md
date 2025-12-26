# Supabase Database Schema Setup

Run these SQL commands in your Supabase dashboard (SQL Editor) to set up the database:

## 1. Create Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 2. Create Posts Table
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 3. Create Storage Bucket (in Supabase Storage)
1. Go to Storage tab in Supabase dashboard
2. Create a new bucket called "post-images"
3. Set it to Public
4. Go to Policies tab for the "post-images" bucket
5. Add the following policies:

```sql
-- Allow public read access
CREATE POLICY "Public access for post-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-images');

-- Allow public upload
CREATE POLICY "Allow public uploads to post-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'post-images');

-- Allow public delete
CREATE POLICY "Allow public delete from post-images" ON storage.objects
  FOR DELETE USING (bucket_id = 'post-images');
```

## 4. Set Row Level Security (RLS) Policies

### Users Table
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Anyone can read users
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Users can insert themselves
CREATE POLICY "Users can insert themselves" ON users
  FOR INSERT WITH CHECK (true);
```

### Posts Table
```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read posts
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

-- Anyone can insert posts
CREATE POLICY "Anyone can insert posts" ON posts
  FOR INSERT WITH CHECK (true);

-- Anyone can update posts
CREATE POLICY "Anyone can update posts" ON posts
  FOR UPDATE USING (true) WITH CHECK (true);

-- Anyone can delete posts
CREATE POLICY "Anyone can delete posts" ON posts
  FOR DELETE USING (true);
```

After creating the tables, update your .env.local file with your Supabase credentials:
- NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous key
