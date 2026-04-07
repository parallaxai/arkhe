import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const siteConfig = {
  name: 'Arkhe',
  repository: 'parallaxai/arkhe',
  branch: 'main',
};

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: siteConfig.name,
    },
    githubUrl: `https://github.com/${siteConfig.repository}`,
  };
}
