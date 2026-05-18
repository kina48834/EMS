const USER_AGENT = 'EMS-ExpoMobile/1.0 (resident app; contact: local dev)';

export type PlaceSuggestion = { lat: number; lng: number; name: string };

export async function searchPlacesPh(query: string): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ph&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': USER_AGENT } });
  if (!r.ok) return [];
  const data = (await r.json()) as unknown[];
  const out: PlaceSuggestion[] = [];
  for (const item of data) {
    const x = item as Record<string, unknown>;
    const lat = Number(x.lat);
    const lng = Number(x.lon);
    const name = x.display_name;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || typeof name !== 'string') continue;
    out.push({ lat, lng, name });
  }
  return out;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
  const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': USER_AGENT } });
  if (!r.ok) return null;
  const data = (await r.json()) as Record<string, unknown>;
  const displayName = data.display_name;
  return typeof displayName === 'string' ? displayName : null;
}
