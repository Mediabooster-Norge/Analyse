const MEDIA_BOOSTER_EMAIL_DOMAIN = '@mediabooster.no';

/** Internal Mediabooster staff – any authenticated @mediabooster.no address. */
export function isMediaboosterDomainEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(MEDIA_BOOSTER_EMAIL_DOMAIN);
}
