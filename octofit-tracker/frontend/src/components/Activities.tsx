import { CapabilityCard, displayField } from './CapabilityCard.js';
export default function Activities() {
  return <CapabilityCard
    title="Activities"
    description="Track student activity minutes and points."
    endpoint="/api/activities"
    collection="activities"
    emptyText="No activities yet."
    renderItem={(item) => `${displayField(item, 'type')} — ${displayField(item, 'minutes')} minutes — ${displayField(item, 'points')} points`}
  />;
}
