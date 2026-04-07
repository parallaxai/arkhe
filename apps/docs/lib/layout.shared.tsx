import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const siteConfig = {
  name: 'Acme',
  repository: 'AcmeOrg/acme',
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
