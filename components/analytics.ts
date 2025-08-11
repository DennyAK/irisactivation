// Minimal analytics shim (console only). Add Sentry later inside app/_layout when EAS is set.
type Props = Record<string, any> | undefined;

export function trackEvent(name: string, props?: Props) {
  try {
    console.log('[analytics]', name, props || {});
  } catch {}
}

export function trackScreen(name: string, props?: Props) {
  trackEvent(`screen_${name}`, props);
}
