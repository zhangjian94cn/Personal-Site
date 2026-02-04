import { ComponentPropsWithoutRef } from 'react';

declare module 'mdx/types' {
  interface MDXComponents {
    [key: string]: React.ComponentType<ComponentPropsWithoutRef<any>>;
  }
}
