import policyContent from './policy-content.html?raw';
import classes from './PrivacyPolicy.module.css';

/**
 * Trusted, checked-in content migrated unchanged from the legacy site. It is
 * rendered as static HTML so the published document is not duplicated or
 * rewritten as JSX.
 */
export function PrivacyPolicy() {
  return (
    <main id="main-content" tabIndex={-1}>
      <article
        className={classes['policy']}
        dangerouslySetInnerHTML={{ __html: policyContent }}
      />
    </main>
  );
}
