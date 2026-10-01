/**
 * Kraxyy Apply Extension Configuration
 *
 * Central configuration for Chrome Web Store distribution and installation.
 * In development, defaults to configurable environment variable or Chrome Web Store home.
 * In production, directs users to the published Kraxyy Apply Chrome Web Store listing.
 */

export const INSTALL_EXTENSION_URL: string =
  import.meta.env.VITE_CHROME_WEB_STORE_URL ||
  (import.meta.env.DEV
    ? 'https://chromewebstore.google.com/'
    : 'https://chromewebstore.google.com/detail/kraxyy-apply');
