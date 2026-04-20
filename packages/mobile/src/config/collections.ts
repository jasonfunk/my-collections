import { CollectionType } from '@my-collections/shared';

export interface CollectionConfig {
  label: string;
  color: string;
  subtitle: string;
  slug: string;
}

export const COLLECTION_CONFIG: Record<CollectionType, CollectionConfig> = {
  [CollectionType.STAR_WARS]: {
    label: 'Star Wars',
    color: '#fbbf24',
    subtitle: 'Original Trilogy · 1977–1985',
    slug: 'star-wars',
  },
  [CollectionType.TRANSFORMERS]: {
    label: 'Transformers',
    color: '#60a5fa',
    subtitle: 'Generation 1 · 1984–1990',
    slug: 'transformers',
  },
  [CollectionType.HE_MAN]: {
    label: 'He-Man',
    color: '#a78bfa',
    subtitle: 'Masters of the Universe · 1981–1988',
    slug: 'he-man',
  },
};

export const SLUG_TO_COLLECTION: Record<string, CollectionType> = {
  'star-wars': CollectionType.STAR_WARS,
  transformers: CollectionType.TRANSFORMERS,
  'he-man': CollectionType.HE_MAN,
};
