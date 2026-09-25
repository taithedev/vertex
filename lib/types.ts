export type GameSummary = {
  id: string;
  title: string;
  slug: string;
  description: string;
  genre: string;
  status: string;
  age_rating: string;
  thumbnail_url: string | null;
  icon_url: string | null;
  current_version: string;
  likes_count: number;
  favorites_count: number;
  visits_count: number;
  published_at: string | null;
  updated_at: string;
};
