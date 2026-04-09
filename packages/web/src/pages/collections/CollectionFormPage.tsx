import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CollectionItem } from '@my-collections/shared';
import { AcquisitionSource, ConditionGrade, PackagingCondition } from '@my-collections/shared';
import { apiClient } from '@/api/client.js';
import { getConfig } from '@/lib/collectionConfig.js';
import {
  BaseFormFields,
  makeBaseDefaults,
  type BaseFormData,
} from '@/components/collections/forms/BaseFormFields.js';
import {
  StarWarsFormFields,
  makeStarWarsDefaults,
  type StarWarsFormData,
} from '@/components/collections/forms/StarWarsFormFields.js';
import {
  TransformersFormFields,
  makeTransformersDefaults,
  type TransformersFormData,
} from '@/components/collections/forms/TransformersFormFields.js';
import {
  MastersFormFields,
  makeMastersDefaults,
  type MastersFormData,
} from '@/components/collections/forms/MastersFormFields.js';
import { Button } from '@/components/ui/button.js';
import { Separator } from '@/components/ui/separator.js';
import { Skeleton } from '@/components/ui/skeleton.js';
import { ArrowLeftIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// Serialisation helpers: form strings → API-ready values
// ---------------------------------------------------------------------------

function parseOptionalNumber(s: string): number | undefined {
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}

function parseOptionalInt(s: string): number | undefined {
  const n = parseInt(s, 10);
  return isNaN(n) ? undefined : n;
}

function buildBaseDto(base: BaseFormData) {
  return {
    name: base.name.trim(),
    condition: base.condition,
    packagingCondition: base.packagingCondition,
    isOwned: base.isOwned,
    isComplete: base.isComplete,
    ...(base.acquisitionSource ? { acquisitionSource: base.acquisitionSource } : {}),
    ...(base.acquisitionDate ? { acquisitionDate: base.acquisitionDate } : {}),
    ...(base.acquisitionPrice !== '' ? { acquisitionPrice: parseOptionalNumber(base.acquisitionPrice) } : {}),
    ...(base.estimatedValue !== '' ? { estimatedValue: parseOptionalNumber(base.estimatedValue) } : {}),
    ...(base.notes.trim() ? { notes: base.notes.trim() } : {}),
    photoUrls: base.photoUrls,
  };
}

function buildStarWarsDto(base: BaseFormData, sw: StarWarsFormData) {
  return {
    ...buildBaseDto(base),
    line: sw.line,
    figureSize: sw.figureSize,
    isVariant: sw.isVariant,
    isCarded: sw.isCarded,
    accessories: sw.accessories,
    ownedAccessories: sw.ownedAccessories,
    coinIncluded: sw.coinIncluded,
    ...(sw.isVariant && sw.variantDescription ? { variantDescription: sw.variantDescription } : {}),
    ...(sw.isCarded && sw.cardbackStyle ? { cardbackStyle: sw.cardbackStyle } : {}),
    ...(sw.kennerItemNumber.trim() ? { kennerItemNumber: sw.kennerItemNumber.trim() } : {}),
  };
}

function buildTransformersDto(base: BaseFormData, tf: TransformersFormData) {
  return {
    ...buildBaseDto(base),
    faction: tf.faction,
    line: tf.line,
    size: tf.size,
    altMode: tf.altMode.trim(),
    isBoxed: tf.isBoxed,
    hasInstructions: tf.hasInstructions,
    hasTechSpec: tf.hasTechSpec,
    rubSign: tf.rubSign,
    isCombiner: tf.isCombiner,
    isGiftSet: tf.isGiftSet,
    isMailaway: tf.isMailaway,
    japaneseRelease: tf.japaneseRelease,
    accessories: tf.accessories,
    ownedAccessories: tf.ownedAccessories,
    ...(tf.isCombiner && tf.combinerTeam.trim() ? { combinerTeam: tf.combinerTeam.trim() } : {}),
  };
}

function buildMastersDto(base: BaseFormData, motu: MastersFormData) {
  return {
    ...buildBaseDto(base),
    line: motu.line,
    characterType: motu.characterType,
    isVariant: motu.isVariant,
    isCarded: motu.isCarded,
    hasBackCard: motu.hasBackCard,
    hasArmorOrFeature: motu.hasArmorOrFeature,
    accessories: motu.accessories,
    ownedAccessories: motu.ownedAccessories,
    ...(motu.releaseYear ? { releaseYear: parseOptionalInt(motu.releaseYear) } : {}),
    ...(motu.isVariant && motu.variantDescription ? { variantDescription: motu.variantDescription } : {}),
    ...(motu.hasArmorOrFeature && motu.featureDescription ? { featureDescription: motu.featureDescription } : {}),
    ...(motu.miniComic.trim() ? { miniComic: motu.miniComic.trim() } : {}),
  };
}

// ---------------------------------------------------------------------------
// Populate form state from an existing item (edit mode)
// ---------------------------------------------------------------------------

function itemToBase(item: CollectionItem & Record<string, unknown>): BaseFormData {
  return {
    name: item.name,
    condition: item.condition ?? ConditionGrade.VERY_FINE,
    packagingCondition: item.packagingCondition ?? PackagingCondition.NONE,
    isOwned: item.isOwned,
    isComplete: item.isComplete,
    acquisitionSource: (item.acquisitionSource as AcquisitionSource | undefined) ?? '',
    acquisitionDate: (item.acquisitionDate as string | undefined) ?? '',
    acquisitionPrice: item.acquisitionPrice != null ? String(item.acquisitionPrice) : '',
    estimatedValue: item.estimatedValue != null ? String(item.estimatedValue) : '',
    notes: item.notes ?? '',
    photoUrls: item.photoUrls ?? [],
  };
}

function itemToStarWars(item: Record<string, unknown>): StarWarsFormData {
  const defaults = makeStarWarsDefaults();
  return {
    line: (item.line as StarWarsFormData['line']) ?? defaults.line,
    figureSize: (item.figureSize as StarWarsFormData['figureSize']) ?? defaults.figureSize,
    isVariant: (item.isVariant as boolean) ?? false,
    variantDescription: (item.variantDescription as string | undefined) ?? '',
    isCarded: (item.isCarded as boolean) ?? false,
    cardbackStyle: (item.cardbackStyle as StarWarsFormData['cardbackStyle'] | undefined) ?? '',
    accessories: (item.accessories as string[]) ?? [],
    ownedAccessories: (item.ownedAccessories as string[]) ?? [],
    coinIncluded: (item.coinIncluded as boolean) ?? false,
    kennerItemNumber: (item.kennerItemNumber as string | undefined) ?? '',
  };
}

function itemToTransformers(item: Record<string, unknown>): TransformersFormData {
  const defaults = makeTransformersDefaults();
  return {
    faction: (item.faction as TransformersFormData['faction']) ?? defaults.faction,
    line: (item.line as TransformersFormData['line']) ?? defaults.line,
    size: (item.size as TransformersFormData['size']) ?? defaults.size,
    altMode: (item.altMode as string) ?? '',
    isBoxed: (item.isBoxed as boolean) ?? false,
    hasInstructions: (item.hasInstructions as boolean) ?? false,
    hasTechSpec: (item.hasTechSpec as boolean) ?? false,
    rubSign: (item.rubSign as boolean) ?? false,
    isCombiner: (item.isCombiner as boolean) ?? false,
    combinerTeam: (item.combinerTeam as string | undefined) ?? '',
    isGiftSet: (item.isGiftSet as boolean) ?? false,
    isMailaway: (item.isMailaway as boolean) ?? false,
    japaneseRelease: (item.japaneseRelease as boolean) ?? false,
    accessories: (item.accessories as string[]) ?? [],
    ownedAccessories: (item.ownedAccessories as string[]) ?? [],
  };
}

function itemToMasters(item: Record<string, unknown>): MastersFormData {
  const defaults = makeMastersDefaults();
  return {
    line: (item.line as MastersFormData['line']) ?? defaults.line,
    characterType: (item.characterType as MastersFormData['characterType']) ?? defaults.characterType,
    releaseYear: item.releaseYear != null ? String(item.releaseYear) : '',
    isVariant: (item.isVariant as boolean) ?? false,
    variantDescription: (item.variantDescription as string | undefined) ?? '',
    isCarded: (item.isCarded as boolean) ?? false,
    hasBackCard: (item.hasBackCard as boolean) ?? false,
    miniComic: (item.miniComic as string | undefined) ?? '',
    hasArmorOrFeature: (item.hasArmorOrFeature as boolean) ?? false,
    featureDescription: (item.featureDescription as string | undefined) ?? '',
    accessories: (item.accessories as string[]) ?? [],
    ownedAccessories: (item.ownedAccessories as string[]) ?? [],
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export function CollectionFormPage() {
  const { collection, id } = useParams<{ collection: string; id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEdit = !!id;
  const config = collection ? getConfig(collection) : null;

  // Form state
  const [base, setBase] = useState<BaseFormData>(makeBaseDefaults);
  const [swData, setSwData] = useState<StarWarsFormData>(makeStarWarsDefaults);
  const [tfData, setTfData] = useState<TransformersFormData>(makeTransformersDefaults);
  const [motuData, setMotuData] = useState<MastersFormData>(makeMastersDefaults);
  const [baseErrors, setBaseErrors] = useState<Partial<Record<keyof BaseFormData, string>>>({});
  const [tfErrors, setTfErrors] = useState<Partial<Record<keyof TransformersFormData, string>>>({});
  const [motuErrors, setMotuErrors] = useState<Partial<Record<keyof MastersFormData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Fetch existing item in edit mode
  const { data: existingItem } = useQuery({
    queryKey: ['collection-item', collection, id],
    queryFn: () => apiClient.get<CollectionItem>(`${config!.apiPath}/${id}`),
    enabled: isEdit && !!config && !!id,
  });

  // Populate form from fetched item (runs once when data arrives)
  useEffect(() => {
    if (!existingItem || initialized) return;
    const item = existingItem as CollectionItem & Record<string, unknown>;
    setBase(itemToBase(item));
    if (collection === 'star-wars') setSwData(itemToStarWars(item));
    if (collection === 'transformers') setTfData(itemToTransformers(item));
    if (collection === 'he-man') setMotuData(itemToMasters(item));
    setInitialized(true);
  }, [existingItem, initialized, collection]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (dto: unknown) => apiClient.post<CollectionItem>(config!.apiPath, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['collection', config!.key] });
      navigate(`/collections/${collection}`);
    },
    onError: (err: Error) => setSubmitError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (dto: unknown) =>
      apiClient.patch<CollectionItem>(`${config!.apiPath}/${id}`, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(['collection-item', collection, id], data);
      void queryClient.invalidateQueries({ queryKey: ['collection', config!.key] });
      navigate(`/collections/${collection}/${id}`);
    },
    onError: (err: Error) => setSubmitError(err.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validate(): boolean {
    const newBaseErrors: typeof baseErrors = {};
    const newTfErrors: typeof tfErrors = {};
    const newMotuErrors: typeof motuErrors = {};

    if (!base.name.trim()) newBaseErrors.name = 'Name is required';

    if (collection === 'transformers' && !tfData.altMode.trim()) {
      newTfErrors.altMode = 'Alt mode is required';
    }

    if (collection === 'he-man' && motuData.releaseYear) {
      const year = parseInt(motuData.releaseYear, 10);
      if (isNaN(year) || year < 1981 || year > 1990) {
        newMotuErrors.releaseYear = 'Must be between 1981 and 1990';
      }
    }

    setBaseErrors(newBaseErrors);
    setTfErrors(newTfErrors);
    setMotuErrors(newMotuErrors);
    return (
      Object.keys(newBaseErrors).length === 0 &&
      Object.keys(newTfErrors).length === 0 &&
      Object.keys(newMotuErrors).length === 0
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate() || !config) return;

    let dto: unknown;
    if (collection === 'star-wars') dto = buildStarWarsDto(base, swData);
    else if (collection === 'transformers') dto = buildTransformersDto(base, tfData);
    else dto = buildMastersDto(base, motuData);

    if (isEdit) updateMutation.mutate(dto);
    else createMutation.mutate(dto);
  }

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Collection not found.</p>
      </div>
    );
  }

  // Show skeleton while loading existing item in edit mode
  const isLoadingExisting = isEdit && !initialized;

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Top nav */}
      <header className="border-b bg-background px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate(isEdit ? `/collections/${collection}/${id}` : `/collections/${collection}`)}
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            {isEdit ? 'Back to item' : config.label}
          </Button>
          <h1 className="text-lg font-semibold">
            {isEdit ? 'Edit item' : `Add ${config.label} figure`}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {isLoadingExisting ? (
          <FormSkeleton />
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-8">
              {/* Base fields */}
              <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  General
                </h2>
                <BaseFormFields data={base} errors={baseErrors} onChange={(p) => setBase((prev) => ({ ...prev, ...p }))} />
              </section>

              <Separator />

              {/* Collection-specific fields */}
              <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {config.label} Details
                </h2>
                {collection === 'star-wars' && (
                  <StarWarsFormFields
                    data={swData}
                    onChange={(p) => setSwData((prev) => ({ ...prev, ...p }))}
                  />
                )}
                {collection === 'transformers' && (
                  <TransformersFormFields
                    data={tfData}
                    errors={tfErrors}
                    onChange={(p) => setTfData((prev) => ({ ...prev, ...p }))}
                  />
                )}
                {collection === 'he-man' && (
                  <MastersFormFields
                    data={motuData}
                    errors={motuErrors}
                    onChange={(p) => setMotuData((prev) => ({ ...prev, ...p }))}
                  />
                )}
              </section>

              <Separator />

              {/* Submit */}
              <div className="flex items-center justify-between">
                {submitError && (
                  <p className="text-sm text-destructive">{submitError}</p>
                )}
                <div className="ml-auto flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      navigate(
                        isEdit
                          ? `/collections/${collection}/${id}`
                          : `/collections/${collection}`,
                      )
                    }
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add item'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
