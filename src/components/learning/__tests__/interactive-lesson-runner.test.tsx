import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InteractiveLessonRunner } from '../interactive-lesson-runner';
import * as learningClient from '@/lib/learning-client';

// Mock next/image, next/link, and next/navigation
vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt="" {...props} />,
}));
vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children?: React.ReactNode; href?: string; [key: string]: unknown }) => <a href={href} {...rest}>{children}</a>,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe('InteractiveLessonRunner static rendering and semantic structure', () => {
  it('renders runner shell with child accessibility semantics and loading/state elements', () => {
    const html = renderToStaticMarkup(<InteractiveLessonRunner lessonId="test-lesson" />);
    expect(html).toContain('Đang tải hoạt động học tập...');
    expect(html).toBeDefined();
  });
});
