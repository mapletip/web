import { createFileRoute } from '@tanstack/react-router';

import { SITE_ORIGIN } from '@/config/site';
import { PrivacyPolicy } from '@/features/privacy/PrivacyPolicy';

export const Route = createFileRoute('/privacy')({
  head: () => ({
    meta: [
      { title: 'Privacy Policy | MapleTip' },
      {
        name: 'description',
        content:
          'Learn how MapleTip handles website information, cookies, advertising, and your privacy choices.',
      },
      { name: 'robots', content: 'index,follow' },
    ],
    links: [{ rel: 'canonical', href: `${SITE_ORIGIN}/privacy` }],
  }),
  component: PrivacyPolicy,
});
