import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer';
import type {
  UserStarWarsItem,
  UserG1TransformersItem,
  UserMastersItem,
} from '@my-collections/shared';
import {
  STAR_WARS_LINE_LABELS,
  FACTION_LABELS,
  TF_LINE_LABELS,
  MASTERS_LINE_LABELS,
  CONDITION_GRADE_NAMES,
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

  // Item rows (list layout, full-width)
  itemRow: {
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#ffffff',
    marginBottom: 5,
  },
  itemName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111827', marginBottom: 2 },
  itemMeta: { fontSize: 7.5, color: '#6b7280', marginBottom: 4 },
  accessoryRow: { flexDirection: 'row', marginBottom: 2 },
  accessoryLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', width: 52 },
  accessoryText: { flex: 1, fontSize: 7.5, lineHeight: 1.4 },
  missingLabel: { color: '#b45309' },
  missingText:  { color: '#92400e' },
  haveLabel:    { color: '#065f46' },
  haveText:     { color: '#374151' },
  itemNotes: { fontSize: 7.5, fontFamily: 'Helvetica-Oblique', color: '#6b7280', marginTop: 3, lineHeight: 1.4 },
});

// ── Minimal markdown → React-PDF renderer ────────────────────────────────────

type InlineSpan = { text: string; bold: boolean; italic: boolean };

function parseInline(line: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
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
  return parseInline(line).map((s, i) => (
    <Text key={i} style={{ fontFamily: inlineFamily(s) }}>{s.text}</Text>
  ));
}

function renderMarkdown(md: string) {
  const lines = md.split('\n');
  const elements: React.ReactElement[] = [];
  let paraLines: string[] = [];
  let key = 0;

  function flushPara() {
    if (paraLines.length === 0) return;
    const text = paraLines.join(' ');
    elements.push(
      <View key={key++} style={S.mdBlock}>
        <Text style={S.mdBody}>{renderInline(text)}</Text>
      </View>,
    );
    paraLines = [];
  }

  lines.forEach((line) => {
    if (line.startsWith('# ')) {
      flushPara();
      elements.push(<View key={key++} style={S.mdBlock}><Text style={S.mdH1}>{line.slice(2)}</Text></View>);
    } else if (line.startsWith('## ')) {
      flushPara();
      elements.push(<View key={key++} style={S.mdBlock}><Text style={S.mdH2}>{line.slice(3)}</Text></View>);
    } else if (line.match(/^[-•]\s/)) {
      flushPara();
      const content = line.replace(/^[-•]\s/, '');
      elements.push(
        <View key={key++} style={S.mdBulletRow}>
          <Text style={S.mdBulletDot}>•</Text>
          <Text style={S.mdBulletText}>{renderInline(content)}</Text>
        </View>,
      );
    } else if (line.trim() === '') {
      flushPara();
      elements.push(<View key={key++} style={S.mdSpacer} />);
    } else {
      paraLines.push(line.trim());
    }
  });

  flushPara();
  return elements;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function missingAccessories(catalogAcc: string[], ownedAcc: string[]): string[] {
  return catalogAcc.filter(a => !ownedAcc.includes(a));
}

// ── Item row ──────────────────────────────────────────────────────────────────

interface ItemRowProps {
  name: string;
  meta: string;
  catalogAccessories: string[];
  ownedAccessories: string[];
  notes?: string | null;
}

function ItemRow({ name, meta, catalogAccessories, ownedAccessories, notes }: ItemRowProps) {
  const missing = missingAccessories(catalogAccessories, ownedAccessories);
  const have = ownedAccessories.filter(a => catalogAccessories.includes(a));

  return (
    <View style={S.itemRow}>
      <Text style={S.itemName}>{name}</Text>
      {meta ? <Text style={S.itemMeta}>{meta}</Text> : null}
      <View style={S.accessoryRow}>
        <Text style={[S.accessoryLabel, S.missingLabel]}>MISSING:</Text>
        <Text style={[S.accessoryText, S.missingText]}>{missing.join(', ')}</Text>
      </View>
      {have.length > 0 && (
        <View style={S.accessoryRow}>
          <Text style={[S.accessoryLabel, S.haveLabel]}>HAVE:</Text>
          <Text style={[S.accessoryText, S.haveText]}>{have.join(', ')}</Text>
        </View>
      )}
      {notes ? <Text style={S.itemNotes}>{notes}</Text> : null}
    </View>
  );
}

// ── Collection section ────────────────────────────────────────────────────────

function CollectionSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <View style={S.sectionHeader}>
        <Text style={S.sectionTitle}>{title}</Text>
        <View style={S.sectionRule} />
      </View>
      {children}
    </View>
  );
}

// ── Per-collection item renderers ─────────────────────────────────────────────

function SwRow({ item }: { item: UserStarWarsItem }) {
  const cat = item.catalog;
  const metaParts: string[] = [];
  if (cat?.releaseYear) metaParts.push(String(cat.releaseYear));
  if (cat?.line) metaParts.push(STAR_WARS_LINE_LABELS[cat.line] ?? cat.line);
  if (item.condition) metaParts.push(`${item.condition}${CONDITION_GRADE_NAMES[item.condition] ? ' · ' + CONDITION_GRADE_NAMES[item.condition] : ''}`);

  return (
    <ItemRow
      name={cat?.name ?? 'Unknown'}
      meta={metaParts.join(' · ')}
      catalogAccessories={cat?.accessories ?? []}
      ownedAccessories={item.ownedAccessories}
      notes={item.notes}
    />
  );
}

function TfRow({ item }: { item: UserG1TransformersItem }) {
  const cat = item.catalog;
  const metaParts: string[] = [];
  if (cat?.releaseYear) metaParts.push(String(cat.releaseYear));
  if (cat?.faction) metaParts.push(FACTION_LABELS[cat.faction] ?? cat.faction);
  if (cat?.line) metaParts.push(TF_LINE_LABELS[cat.line] ?? cat.line);
  if (item.condition) metaParts.push(`${item.condition}${CONDITION_GRADE_NAMES[item.condition] ? ' · ' + CONDITION_GRADE_NAMES[item.condition] : ''}`);

  return (
    <ItemRow
      name={cat?.name ?? 'Unknown'}
      meta={metaParts.join(' · ')}
      catalogAccessories={cat?.accessories ?? []}
      ownedAccessories={item.ownedAccessories}
      notes={item.notes}
    />
  );
}

function HeManRow({ item }: { item: UserMastersItem }) {
  const cat = item.catalog;
  const metaParts: string[] = [];
  if (cat?.releaseYear) metaParts.push(String(cat.releaseYear));
  if (cat?.line) metaParts.push(MASTERS_LINE_LABELS[cat.line] ?? cat.line);
  if (item.condition) metaParts.push(`${item.condition}${CONDITION_GRADE_NAMES[item.condition] ? ' · ' + CONDITION_GRADE_NAMES[item.condition] : ''}`);

  return (
    <ItemRow
      name={cat?.name ?? 'Unknown'}
      meta={metaParts.join(' · ')}
      catalogAccessories={cat?.accessories ?? []}
      ownedAccessories={item.ownedAccessories}
      notes={item.notes}
    />
  );
}

// ── Document ──────────────────────────────────────────────────────────────────

interface MissingAccessoriesPdfDocumentProps {
  swItems: UserStarWarsItem[];
  tfItems: UserG1TransformersItem[];
  hemanItems: UserMastersItem[];
  guidanceMarkdown: string;
  generatedDate: string;
}

export function MissingAccessoriesPdfDocument({
  swItems,
  tfItems,
  hemanItems,
  guidanceMarkdown,
  generatedDate,
}: MissingAccessoriesPdfDocumentProps) {
  return (
    <Document title="Missing Accessories" author="My Collections">
      <Page size="LETTER" style={S.page}>
        <View style={S.pageHeader} fixed>
          <Text style={S.pageHeaderTitle}>My Collections — Missing Accessories</Text>
          <Text style={S.pageHeaderDate}>{generatedDate}</Text>
        </View>

        <View style={S.guidanceBox}>
          {renderMarkdown(guidanceMarkdown)}
        </View>

        {swItems.length > 0 && (
          <CollectionSection title="Star Wars">
            {swItems.map((item) => <SwRow key={item.id} item={item} />)}
          </CollectionSection>
        )}

        {tfItems.length > 0 && (
          <CollectionSection title="Transformers">
            {tfItems.map((item) => <TfRow key={item.id} item={item} />)}
          </CollectionSection>
        )}

        {hemanItems.length > 0 && (
          <CollectionSection title="He-Man">
            {hemanItems.map((item) => <HeManRow key={item.id} item={item} />)}
          </CollectionSection>
        )}

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
