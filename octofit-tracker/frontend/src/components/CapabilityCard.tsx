import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Item = Record<string, unknown>;

type Props = {
  title: string;
  description: string;
  endpoint: string;
  collection: string;
  emptyText: string;
  renderItem: (item: Item) => ReactNode;
};

export function displayField(item: Item, field: string): string {
  const value = item[field];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

export function CapabilityCard({ title, description, endpoint, collection, emptyText, renderItem }: Props) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    getJson<Record<string, unknown>>(endpoint).then((payload) => {
      const result = payload[collection];
      if (!Array.isArray(result) || !result.every(
        (item): item is Item => typeof item === 'object' && item !== null && !Array.isArray(item),
      )) {
        throw new Error(`The ${title.toLowerCase()} response was invalid`);
      }
      if (active) setItems(result);
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load data');
    });
    return () => {
      active = false;
    };
  }, [collection, endpoint, title]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {error
          ? <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>
          : items === null
            ? <p role="status">Loading {title.toLowerCase()}...</p>
            : items.length === 0
              ? <p>{emptyText}</p>
              : <ul>{items.map((item, index) => <li key={String(item._id ?? index)}>{renderItem(item)}</li>)}</ul>}
      </div>
    </section>
  );
}
