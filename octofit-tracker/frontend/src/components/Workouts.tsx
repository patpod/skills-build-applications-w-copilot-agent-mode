import { CapabilityCard, displayField } from './CapabilityCard.js';
export default function Workouts() {
  return <CapabilityCard
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    endpoint="/api/workouts/suggestions/mona%40example.com"
    collection="suggestions"
    emptyText="No workout suggestions available."
    renderItem={(item) => `${displayField(item, 'title')} — ${displayField(item, 'focus')}: ${displayField(item, 'reason')}`}
  />;
}
