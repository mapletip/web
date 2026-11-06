import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PrivacyPolicy } from '../PrivacyPolicy';

const html = renderToString(<PrivacyPolicy />);

describe('PrivacyPolicy server rendering', () => {
  it('renders one main landmark, one H1 and the published effective date', () => {
    expect(html.match(/id="main-content"/gu)).toHaveLength(1);
    expect(html.match(/<h1/gu)).toHaveLength(1);
    expect(html).toContain('>Privacy Policy</h1>');
    expect(html).toContain(
      '<time datetime="2026-10-12">October 12, 2026</time>',
    );
  });

  it('preserves the policy section hierarchy and contact details', () => {
    const h1At = html.indexOf('<h1');
    const firstH2At = html.indexOf('<h2');
    expect(h1At).toBeGreaterThanOrEqual(0);
    expect(firstH2At).toBeGreaterThan(h1At);
    expect(html.match(/<h2 /gu)).toHaveLength(12);
    expect(html).toContain('>12. Contact Us</h2>');
    expect(html).toContain('href="mailto:privacy@mapletip.com"');
    expect(html).toContain(
      'href="https://wiki.mapletip.com/wiki/MapleWiki:Privacy_policy"',
    );
  });

  it('keeps external policy links new-tab safe and renders no active content', () => {
    for (const href of [
      'https://policies.google.com/technologies/partner-sites',
      'https://adssettings.google.com/',
      'https://optout.aboutads.info/',
      'https://www.cloudflare.com/privacypolicy/',
      'https://policies.google.com/privacy',
    ]) {
      expect(html).toContain(`href="${href}"`);
    }

    expect(html.match(/target="_blank"/gu)?.length).toBeGreaterThan(0);
    expect(html.match(/rel="noopener noreferrer"/gu)).toHaveLength(
      html.match(/target="_blank"/gu)?.length ?? 0,
    );
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<iframe');
  });
});
