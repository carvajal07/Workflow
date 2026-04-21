/**
 * Stub del Layout Tree (se reemplazará con react-arborist).
 * Muestra una lista estática de nodos para validar el shell.
 */
const MOCK = [
  { label: 'Data', count: 3 },
  { label: 'Pages', count: 1 },
  { label: 'DynamicCommunications', count: 0 },
  { label: 'Elements', count: 0 },
  { label: 'Flows', count: 0 },
  { label: 'ParagraphStyles', count: 0 },
  { label: 'TextStyles', count: 0 },
  { label: 'Fonts', count: 0 },
  { label: 'BorderStyles', count: 0 },
  { label: 'LineStyles', count: 0 },
  { label: 'FillStyles', count: 0 },
  { label: 'Colors', count: 0 },
  { label: 'Images', count: 0 },
  { label: 'Tables', count: 0 },
];

export default function LayoutTree() {
  return (
    <ul className="text-11 py-1">
      {MOCK.map((n) => (
        <li
          key={n.label}
          className="flex items-center px-2 h-[22px] hover:bg-bg-3 cursor-default"
        >
          <span className="text-muted mr-1">▶</span>
          <span className="text-ink flex-1">{n.label}</span>
          <span className="font-mono text-[10px] text-muted">{n.count}</span>
        </li>
      ))}
    </ul>
  );
}
