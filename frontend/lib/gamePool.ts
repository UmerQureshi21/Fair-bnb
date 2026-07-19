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
