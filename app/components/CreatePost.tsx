'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface CreatePostProps {
  onPostCreated: () => void;
}

export default function CreatePost({
  onPostCreated,
}: CreatePostProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...images, ...files].slice(0, 5); // Max 5 images
    setImages(newImages);

    // Create preview URLs
    const urls = newImages.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviewUrls(newUrls);
  };

  const uploadImages = async (postId: string) => {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const fileName = `${postId}-${Date.now()}-${i}`;

      try {
        const { data, error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('post-images').getPublicUrl(fileName);

        console.log('Image uploaded:', publicUrl);
        uploadedUrls.push(publicUrl);
      } catch (err) {
        console.error('Image upload error:', err);
        throw err; // Re-throw to handle in handleSubmit
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Please write something!');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert([
          {
            content: content.trim(),
            image_urls: [],
          },
        ])
        .select()
        .single();

      if (postError) {
        throw postError;
      }

      // Upload images if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        try {
          imageUrls = await uploadImages(post.id);
          console.log('Uploaded image URLs:', imageUrls);

          if (imageUrls.length > 0) {
            // Update post with image URLs
            const { data: updatedPost, error: updateError } = await supabase
              .from('posts')
              .update({ image_urls: imageUrls })
              .eq('id', post.id)
              .select();

            console.log('Update response:', { updatedPost, updateError });

            if (updateError) {
              console.error('Error updating image URLs:', updateError);
              throw updateError;
            }
          }
        } catch (imageErr) {
          console.error('Error uploading images:', imageErr);
          setError('Failed to upload images');
          throw imageErr;
        }
      }

      // Reset form
      setContent('');
      setImages([]);
      setPreviewUrls([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onPostCreated();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create post';
      setError(errorMessage);
      console.error('Post creation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Text Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm sm:text-base text-black"
          rows={3}
        />

        {/* Image Previews */}
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative group">
                <div className="relative w-full aspect-square">
                  <Image
                    src={url}
                    alt={`Preview ${index}`}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || images.length >= 5}
            className="w-full sm:flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
          >
            {images.length >= 5 ? '📷 Max 5 images' : '📷 Add Images'}
          </button>
          <button
            type="submit"
            disabled={isLoading || !content.trim()}
            className="w-full sm:flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
          >
            {isLoading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
    </div>
  );
}
