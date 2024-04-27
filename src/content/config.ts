import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
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
      tags: z.array(z.string()),
    }),
});

const about = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      author: z.string().optional().nullable(),
      // Transform string to Date object
      date: z.coerce.date(),
    }),
});

const unbalanced = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      author: z.string().optional().nullable(),
      // Transform string to Date object
      date: z.coerce.date(),
    }),
});

export const collections = { posts, about, unbalanced };
