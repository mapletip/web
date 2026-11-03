/*
 * Vite library mode cannot take a CSS file as an entry while extracting one
 * shared stylesheet (`cssCodeSplit: false`). This JS entry exists only so the
 * build emits `dist/styles.css` without adding a CSS import to the public JS.
 */
import './styles.css';
