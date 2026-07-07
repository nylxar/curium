interface ModernSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function ModernSwitch({ checked, onChange, label }: ModernSwitchProps) {
  return (
    <label className="switch-wrap">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`switch ${checked ? "switch-on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="switch-thumb" />
      </button>
      {label && <span className="switch-label">{label}</span>}
    </label>
  );
}
