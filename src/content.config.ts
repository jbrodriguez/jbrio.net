import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/data/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      // Transform string to Date object
      date: z.date(),
      updated: z.coerce.date().optional(),
      cover: image().optional(),
      caption: z.string().optional().nullable(),
      status: z.enum(['published', 'draft']),
      pixelfed: z.string().optional().nullable(),
      tags: z.array(z.string()),
    }),
});

const about = defineCollection({
  loader: glob({ pattern: '**/[^_]*.mdx', base: './src/data/about' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      author: z.string().optional().nullable(),
      // Transform string to Date object
      date: z.coerce.date(),
    }),
});

const unbalanced = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/data/unbalanced' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      author: z.string().optional().nullable(),
      // Transform string to Date object
      date: z.coerce.date(),
    }),
});

export const collections = { posts, about, unbalanced };
