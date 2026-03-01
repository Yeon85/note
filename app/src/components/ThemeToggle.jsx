export default function ThemeToggle({ theme, onChange }) {
  return (
    <button
      type="button"
      className="button secondary"
      onClick={() => onChange(theme === 'dark' ? 'light' : 'dark')}
    >
      테마: {theme === 'dark' ? '어둡게' : '밝게'}
    </button>
  );
}
