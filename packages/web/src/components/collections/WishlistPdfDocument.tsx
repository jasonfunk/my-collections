import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import type {
  UserStarWarsItem,
  UserG1TransformersItem,
  UserMastersItem,
} from '@my-collections/shared';
import { WishlistPriority } from '@my-collections/shared';
import {
  STAR_WARS_CATEGORY_LABELS,
  STAR_WARS_LINE_LABELS,
  FACTION_LABELS,
  TF_LINE_LABELS,
  MASTERS_LINE_LABELS,
  MASTERS_CHARACTER_LABELS,
  WISHLIST_PRIORITY_LABELS,
} from '@/lib/collectionConfig.js';

// ── Styles ────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1a1a1a',
  },
  pageHeader: {
    position: 'absolute',
    top: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1d5db',
    paddingBottom: 6,
  },
  pageHeaderTitle: { fontSize: 9, color: '#6b7280', fontFamily: 'Helvetica' },
  pageHeaderDate:  { fontSize: 8, color: '#9ca3af', fontFamily: 'Helvetica' },
  pageFooter: {
    position: 'absolute',
    bottom: 18,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    paddingTop: 5,
  },
  pageFooterText: { fontSize: 7.5, color: '#9ca3af', fontFamily: 'Helvetica' },

  // Guidance block
  guidanceBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  mdH1: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 6, color: '#111827' },
  mdH2: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginTop: 8, marginBottom: 3, color: '#374151' },
  mdBody: { fontSize: 9, lineHeight: 1.5, color: '#374151' },
  mdBlock: { width: '100%' },
  mdBulletRow: { flexDirection: 'row', marginBottom: 2 },
  mdBulletDot: { width: 12, fontSize: 9, color: '#6b7280' },
  mdBulletText: { flex: 1, fontSize: 9, lineHeight: 1.5, color: '#374151' },
  mdSpacer: { height: 4 },

  // Collection section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111827', marginRight: 8 },
  sectionRule: { flex: 1, height: 0.5, backgroundColor: '#d1d5db' },

  // 2-column grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  card: {
    width: '48.5%',
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    padding: 6,
    backgroundColor: '#ffffff',
    gap: 6,
  },
  thumbnail: { width: 56, height: 56, borderRadius: 3, backgroundColor: '#f3f4f6' },
  thumbnailPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPlaceholderText: { fontSize: 7, color: '#9ca3af', textAlign: 'center' },
  cardBody: { flex: 1 },
  cardName: { fontSize: 9, fontFamily: 'Helvetica-Bold', lineHeight: 1.3, marginBottom: 2, color: '#111827' },
  cardMeta: { fontSize: 7.5, color: '#6b7280', lineHeight: 1.4 },
  cardNotes: { fontSize: 7.5, fontFamily: 'Helvetica-Oblique', color: '#6b7280', marginTop: 2, lineHeight: 1.4 },

  // Priority badge
  priorityHigh:   { fontSize: 7, color: '#b91c1c', fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  priorityMedium: { fontSize: 7, color: '#b45309', fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  priorityLow:    { fontSize: 7, color: '#6b7280', fontFamily: 'Helvetica-Bold', marginBottom: 2 },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function toAbsoluteUrl(url: string): string {
  if (!url) return '';
  return url.startsWith('http') ? url : window.location.origin + url;
}

function priorityStyle(p: WishlistPriority | null | undefined) {
  if (p === WishlistPriority.HIGH) return S.priorityHigh;
  if (p === WishlistPriority.MEDIUM) return S.priorityMedium;
  return S.priorityLow;
}

// ── Minimal markdown → React-PDF renderer ────────────────────────────────────
// Handles: # H1, ## H2, - bullets, blank lines, **bold**, *italic* (inline)

type InlineSpan = { text: string; bold: boolean; italic: boolean };

function parseInline(line: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  // Match **bold**, *italic*, or plain text
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) spans.push({ text: line.slice(last, m.index), bold: false, italic: false });
    if (m[1] !== undefined) spans.push({ text: m[1], bold: true,  italic: false });
    else                    spans.push({ text: m[2], bold: false, italic: true  });
    last = m.index + m[0].length;
  }
  if (last < line.length) spans.push({ text: line.slice(last), bold: false, italic: false });
  return spans;
}

function inlineFamily(span: InlineSpan): string {
  if (span.bold && span.italic) return 'Helvetica-BoldOblique';
  if (span.bold) return 'Helvetica-Bold';
  if (span.italic) return 'Helvetica-Oblique';
  return 'Helvetica';
}

function renderInline(line: string) {
  const spans = parseInline(line);
  return spans.map((s, i) => (
    <Text key={i} style={{ fontFamily: inlineFamily(s) }}>{s.text}</Text>
  ));
}

function renderMarkdown(md: string) {
  const lines = md.split('\n');
  const elements: React.ReactElement[] = [];

  lines.forEach((line, i) => {
    if (line.startsWith('# ')) {
      elements.push(
        <View key={i} style={S.mdBlock}>
          <Text style={S.mdH1}>{line.slice(2)}</Text>
        </View>,
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <View key={i} style={S.mdBlock}>
          <Text style={S.mdH2}>{line.slice(3)}</Text>
        </View>,
      );
    } else if (line.match(/^[-•]\s/)) {
      const content = line.replace(/^[-•]\s/, '');
      elements.push(
        <View key={i} style={S.mdBulletRow}>
          <Text style={S.mdBulletDot}>•</Text>
          <Text style={S.mdBulletText}>{renderInline(content)}</Text>
        </View>,
      );
    } else if (line.trim() === '') {
      elements.push(<View key={i} style={S.mdSpacer} />);
    } else {
      elements.push(
        <View key={i} style={S.mdBlock}>
          <Text style={S.mdBody}>{renderInline(line)}</Text>
        </View>,
      );
    }
  });

  return elements;
}

// ── Item cards ────────────────────────────────────────────────────────────────

function SwCard({ item }: { item: UserStarWarsItem }) {
  const cat = item.catalog;
  const imgUrl = cat?.catalogImageUrl ? toAbsoluteUrl(cat.catalogImageUrl) : null;
  const metaParts: string[] = [];
  if (cat?.releaseYear) metaParts.push(String(cat.releaseYear));
  if (cat?.line) metaParts.push(STAR_WARS_LINE_LABELS[cat.line] ?? cat.line);
  if (cat?.category) metaParts.push(STAR_WARS_CATEGORY_LABELS[cat.category] ?? cat.category);

  return <ItemCard
    name={cat?.name ?? 'Unknown'}
    priority={item.wishlistPriority}
    meta={metaParts.join(' · ')}
    accessories={cat?.accessories ?? []}
    notes={item.notes}
    imgUrl={imgUrl}
  />;
}

function TfCard({ item }: { item: UserG1TransformersItem }) {
  const cat = item.catalog;
  const imgUrl = cat?.catalogImageUrl ? toAbsoluteUrl(cat.catalogImageUrl) : null;
  const metaParts: string[] = [];
  if (cat?.releaseYear) metaParts.push(String(cat.releaseYear));
  if (cat?.faction) metaParts.push(FACTION_LABELS[cat.faction] ?? cat.faction);
  if (cat?.line) metaParts.push(TF_LINE_LABELS[cat.line] ?? cat.line);
  if (cat?.altMode) metaParts.push(cat.altMode);
  if (cat?.subgroup) metaParts.push(cat.subgroup);

  return <ItemCard
    name={cat?.name ?? 'Unknown'}
    priority={item.wishlistPriority}
    meta={metaParts.join(' · ')}
    accessories={cat?.accessories ?? []}
    notes={item.notes}
    imgUrl={imgUrl}
  />;
}

function HeManCard({ item }: { item: UserMastersItem }) {
  const cat = item.catalog;
  const imgUrl = cat?.catalogImageUrl ? toAbsoluteUrl(cat.catalogImageUrl) : null;
  const metaParts: string[] = [];
  if (cat?.releaseYear) metaParts.push(String(cat.releaseYear));
  if (cat?.line) metaParts.push(MASTERS_LINE_LABELS[cat.line] ?? cat.line);
  if (cat?.characterType) metaParts.push(MASTERS_CHARACTER_LABELS[cat.characterType] ?? cat.characterType);

  return <ItemCard
    name={cat?.name ?? 'Unknown'}
    priority={item.wishlistPriority}
    meta={metaParts.join(' · ')}
    accessories={cat?.accessories ?? []}
    notes={item.notes}
    imgUrl={imgUrl}
  />;
}

interface ItemCardProps {
  name: string;
  priority?: WishlistPriority | null;
  meta: string;
  accessories: string[];
  notes?: string | null;
  imgUrl: string | null;
}

function ItemCard({ name, priority, meta, accessories, notes, imgUrl }: ItemCardProps) {
  return (
    <View style={S.card}>
      {imgUrl ? (
        <Image style={S.thumbnail} src={imgUrl} />
      ) : (
        <View style={S.thumbnailPlaceholder}>
          <Text style={S.thumbnailPlaceholderText}>no{'\n'}image</Text>
        </View>
      )}
      <View style={S.cardBody}>
        <Text style={priorityStyle(priority)}>
          {priority ? WISHLIST_PRIORITY_LABELS[priority] : ''}
        </Text>
        <Text style={S.cardName}>{name}</Text>
        {meta ? <Text style={S.cardMeta}>{meta}</Text> : null}
        {accessories.length > 0 && (
          <Text style={S.cardMeta}>Accessories: {accessories.join(', ')}</Text>
        )}
        {notes ? <Text style={S.cardNotes}>{notes}</Text> : null}
      </View>
    </View>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function CollectionSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <View style={S.sectionHeader}>
        <Text style={S.sectionTitle}>{title}</Text>
        <View style={S.sectionRule} />
      </View>
      <View style={S.grid}>{children}</View>
    </View>
  );
}

// ── Document ──────────────────────────────────────────────────────────────────

interface WishlistPdfDocumentProps {
  swItems: UserStarWarsItem[];
  tfItems: UserG1TransformersItem[];
  hemanItems: UserMastersItem[];
  guidanceMarkdown: string;
  generatedDate: string;
}

export function WishlistPdfDocument({
  swItems,
  tfItems,
  hemanItems,
  guidanceMarkdown,
  generatedDate,
}: WishlistPdfDocumentProps) {
  return (
    <Document title="Wishlist" author="My Collections">
      <Page size="LETTER" style={S.page}>
        {/* Fixed page header */}
        <View style={S.pageHeader} fixed>
          <Text style={S.pageHeaderTitle}>My Collections — Wishlist</Text>
          <Text style={S.pageHeaderDate}>{generatedDate}</Text>
        </View>

        {/* Guidance block */}
        <View style={S.guidanceBox}>
          {renderMarkdown(guidanceMarkdown)}
        </View>

        {/* Star Wars */}
        {swItems.length > 0 && (
          <CollectionSection title="Star Wars">
            {swItems.map((item) => <SwCard key={item.id} item={item} />)}
          </CollectionSection>
        )}

        {/* Transformers */}
        {tfItems.length > 0 && (
          <CollectionSection title="Transformers">
            {tfItems.map((item) => <TfCard key={item.id} item={item} />)}
          </CollectionSection>
        )}

        {/* He-Man */}
        {hemanItems.length > 0 && (
          <CollectionSection title="He-Man">
            {hemanItems.map((item) => <HeManCard key={item.id} item={item} />)}
          </CollectionSection>
        )}

        {/* Fixed page footer */}
        <View style={S.pageFooter} fixed>
          <Text style={S.pageFooterText}>Generated {generatedDate}</Text>
          <Text
            style={S.pageFooterText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
