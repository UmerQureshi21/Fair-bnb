export type Card = {
  key: string;
  image: string;
  price: number;
  label: string;
};

export type SavedValuation = {
  id: number;
  mode: "host" | "looking";
  fair_price: number | null;
  result: {
    top_matches?: { price: number; thumbnail: string }[];
    worst_matches?: { price: number; thumbnail: string }[];
    user_media_url?: string;
  };
};

export function buildPool(valuations: SavedValuation[]): Card[] {
  const cards: Card[] = [];

  for (const v of valuations) {
    const result = v.result;
    const ownImage = result.user_media_url ?? result.top_matches?.[0]?.thumbnail;
    if (v.fair_price != null && ownImage) {
      cards.push({
        key: `own-${v.id}`,
        image: ownImage,
        price: v.fair_price,
        label: v.mode === "host" ? "Your room" : "This listing",
      });
    }
    for (const m of [...(result.top_matches ?? []), ...(result.worst_matches ?? [])]) {
      if (m.thumbnail && m.price != null) {
        cards.push({
          key: `${v.id}-${m.thumbnail}`,
          image: m.thumbnail,
          price: m.price,
          label: "Nearby hotel",
        });
      }
    }
  }

  // Dedupe by image, not by key: the same hotel thumbnail commonly reappears
  // across multiple saved valuations near the same location (each save gets
  // its own key prefix), which would otherwise let the same photo show up
  // as 2+ "different" cards in a single round.
  const seen = new Set<string>();
  return cards.filter((c) => {
    if (seen.has(c.image)) return false;
    seen.add(c.image);
    return true;
  });
}

export function pickRandom(pool: Card[], exclude: Set<string>): Card | null {
  const candidates = pool.filter((c) => !exclude.has(c.key));
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

type DemoHotel = { thumbnail: string; price: number; url: string };

/**
 * Loads the game's card pool from the user's own saved valuations, and - only
 * if that's too small to play with (e.g. a brand-new account with nothing
 * saved yet) - tops it up with real Stay22 hotels from a fixed demo location,
 * so a new user isn't stuck staring at "save something first" before they
 * can try a game at all.
 */
export async function loadGamePool(
  authFetch: (path: string, init?: RequestInit) => Promise<Response>,
  minCards: number,
): Promise<Card[]> {
  const res = await authFetch("/api/valuations");
  if (!res.ok) throw new Error("Couldn't load your saved valuations.");
  const data = await res.json();
  const pool = buildPool(data.valuations);

  if (pool.length >= minCards) return pool;

  const demoRes = await authFetch("/api/demo-hotels");
  if (!demoRes.ok) return pool;

  const demoData = await demoRes.json();
  const seen = new Set(pool.map((c) => c.image));
  for (const h of (demoData.results ?? []) as DemoHotel[]) {
    if (seen.has(h.thumbnail)) continue;
    seen.add(h.thumbnail);
    pool.push({ key: `demo-${h.thumbnail}`, image: h.thumbnail, price: h.price, label: "Nearby hotel" });
  }
  return pool;
}
