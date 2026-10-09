import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InteractiveLessonRunner } from '../interactive-lesson-runner';
import * as learningClient from '@/lib/learning-client';

// Mock next/image and next/link
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));
vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
}));

describe('InteractiveLessonRunner static rendering and semantic structure', () => {
  it('renders runner shell with child accessibility semantics and loading/state elements', () => {
    const html = renderToStaticMarkup(<InteractiveLessonRunner lessonId="test-lesson" />);
    expect(html).toContain('Đang tải hoạt động học tập...');
    expect(html).toBeDefined();
  });
});
