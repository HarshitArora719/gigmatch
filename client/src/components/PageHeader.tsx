import type { ReactNode } from 'react';
import AnimatedSection from './AnimatedSection';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}

export default function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <div className="page-header noise-bg border-b border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="container-app py-12 md:py-16">
        <AnimatedSection>
          {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
          <h1 className="page-title text-3xl md:text-5xl text-[var(--text-primary)]">{title}</h1>
          {description && (
            <p className="mt-3 max-w-2xl text-[var(--text-secondary)] text-base md:text-lg">{description}</p>
          )}
          {children}
        </AnimatedSection>
      </div>
    </div>
  );
}
