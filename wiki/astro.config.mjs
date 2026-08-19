import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  site: 'https://yivas.github.io',
  base: '/pi-subagent-models',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'pi-subagent-models',
      description: 'Choose one model and thinking level for every pi-subagents child.',
      lastUpdated: true,
      customCss: ['./src/styles/custom.css'],
      editLink: {
        baseUrl: 'https://github.com/Yivas/pi-subagent-models/edit/main/wiki/',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/Yivas/pi-subagent-models',
        },
      ],
      sidebar: [
        {
          label: 'Guide',
          collapsed: false,
          items: [
            { label: 'Getting started', slug: 'getting-started' },
            { label: 'Commands', slug: 'commands' },
            { label: 'Selection behavior', slug: 'selection-behavior' },
          ],
        },
        {
          label: 'Project',
          collapsed: true,
          items: [
            { label: 'Development', slug: 'development' },
            { label: 'Security', slug: 'security' },
          ],
        },
      ],
    }),
  ],
})
