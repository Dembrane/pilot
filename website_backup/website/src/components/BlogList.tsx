'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLingui } from '@lingui/react';
import { t } from '@lingui/macro';
import Image from 'next/image';

interface Post {
  id: string;
  title: string;
  description: string;
  slug: string;
  date: string;
  cover: string;
  emoji: string;
}

interface BlogListProps {
  posts: Post[];
}

export default function BlogList({ posts }: BlogListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { i18n } = useLingui();

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-8">
        <input
          type="text"
          placeholder={i18n._(t({ id: 'Search articles...' }))}
          className="w-full max-w-xl rounded-lg border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.map((post) => (
          <Link
            key={post.id}
            href={`/${i18n.locale ?? 'en-US'}/blog/${post.slug}`}
            className="block break-inside-avoid-column rounded-lg border bg-card transition-shadow hover:shadow-lg "
          >
            <Image src={post.cover} alt={post.title} width={500} height={300} />
            <div className="flex items-start gap-2 p-6">
              <span className="text-xl md:text-2xl">{post.emoji}</span>
              <div className="">
                <h2 className="mb-2 text-xl md:text-2xl">{post.title}</h2>
                <time className="text-sm text-muted-foreground">
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">
          {i18n._(t`No posts found matching your search.`)}
        </p>
      )}
    </div>
  );
}
