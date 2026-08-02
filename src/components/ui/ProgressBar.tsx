import { Check } from 'lucide-react';

interface Step {
  label: string;
}

interface ProgressBarProps {
  steps: Step[];
  current: number; // 0-indexed
}

export default function ProgressBar({ steps, current }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex items-center">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    done
                      ? 'bg-primary-600 text-white'
                      : active
                        ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {done ? <Check className="w-5 h-5" /> : i + 1}
                </div>
                <span
                  className={`text-[11px] font-medium hidden sm:block ${active || done ? 'text-ink' : 'text-gray-400'}`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 rounded-full bg-gray-200 relative overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 bg-primary-600 transition-all duration-500 ${done ? 'w-full' : 'w-0'}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
