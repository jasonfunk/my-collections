interface AccessoriesListProps {
  accessories: string[];
  ownedAccessories: string[];
}

export function AccessoriesList({ accessories, ownedAccessories }: AccessoriesListProps) {
  if (accessories.length === 0) {
    return <p className="text-sm text-muted-foreground">No accessories listed</p>;
  }

  const ownedSet = new Set(ownedAccessories);

  return (
    <ul className="flex flex-wrap gap-2">
      {accessories.map((acc) => {
        const isOwned = ownedSet.has(acc);
        return (
          <li
            key={acc}
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${
              isOwned
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            <span>{isOwned ? '✓' : '✗'}</span>
            <span>{acc}</span>
          </li>
        );
      })}
    </ul>
  );
}
