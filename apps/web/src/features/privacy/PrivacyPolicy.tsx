import policyContent from './policy-content.html?raw';
import classes from './PrivacyPolicy.module.css';

/**
 * Trusted, checked-in content migrated from the legacy site. It is rendered as
 * static HTML so the published document is not duplicated or rewritten as JSX.
 * Its provider and storage claims still need owner legal review for the new
 * runtime; see the integration PR.
 */
export function PrivacyPolicy() {
  return (
    <main id="main-content" tabIndex={-1} className={classes['page']}>
      <article
        className={classes['policy']}
        dangerouslySetInnerHTML={{ __html: policyContent }}
      />
    </main>
  );
}
