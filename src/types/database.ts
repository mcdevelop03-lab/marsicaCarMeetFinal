export type UserRole = "member" | "organizer" | "admin";

export type Profile = {
  id: string;
  name: string | null;
  tag: string | null;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  town: string | null;
  socials: Record<string, string>;
  created_at: string;
};

// Sottoinsieme di Profile usato nelle card dei risultati. `tag` è non-nullo:
// i profili senza tag non sono raggiungibili da /membri/[tag] e vanno filtrati.
export type MemberSummary = {
  id: string;
  name: string | null;
  tag: string;
  avatar_url: string | null;
  town: string | null;
};
