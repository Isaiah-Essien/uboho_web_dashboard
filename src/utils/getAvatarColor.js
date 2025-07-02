// Returns a consistent color for a given name string
export default function getAvatarColor(name) {
  if (!name) return '#bdbdbd';
  // Simple hash to pick a color
  const colors = [
    '#7e5cef', '#2563eb', '#059669', '#eab308', '#ef4444', '#f59e42', '#14b8a6', '#6366f1', '#f43f5e', '#0ea5e9', '#a21caf', '#b91c1c', '#f59e42', '#64748b', '#e11d48', '#0d9488', '#fbbf24', '#3b82f6', '#10b981', '#f472b6', '#facc15'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length];
  return color;
}
