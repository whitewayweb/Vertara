import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/lib/format-time";

interface EditorRangeControlProps {
  label: string;
  max?: number;
  min?: number;
  onChange(value: number): void;
  step?: number;
  suffix: string;
  value: number;
}

export function EditorRangeControl({ label, max = 100, min = 0, onChange, step = 1, suffix, value }: EditorRangeControlProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-200">{label}</span>
        <span className="text-slate-500">{suffix === "" ? formatTime(value) : `${value.toFixed(step < 1 ? 2 : 0)}${suffix}`}</span>
      </div>
      <Slider
        max={max}
        min={min}
        onValueChange={(nextValue) => {
          const nextNumber = Array.isArray(nextValue) ? nextValue[0] : nextValue;
          if (typeof nextNumber === "number") onChange(nextNumber);
        }}
        step={step}
        value={[value]}
      />
    </div>
  );
}
