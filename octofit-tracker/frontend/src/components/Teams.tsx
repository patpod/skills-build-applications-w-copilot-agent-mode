import { CapabilityCard, displayField } from './CapabilityCard.js';
export default function Teams() {
  return <CapabilityCard
    title="Teams"
    description="Manage teams and members."
    endpoint="/api/teams"
    collection="teams"
    emptyText="No teams yet."
    renderItem={(item) => {
      const members = Array.isArray(item.members) ? item.members.join(', ') : '';
      return `${displayField(item, 'name')}${members ? ` — Members: ${members}` : ''}`;
    }}
  />;
}
