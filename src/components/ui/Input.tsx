import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const baseField =
  'w-full rounded-xl border bg-white px-4 text-ink placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500';

const errorField = 'border-error-300 focus:border-error-500 focus:ring-error-500/30';
const normalField = 'border-gray-300 hover:border-gray-400';

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, leftIcon, rightIcon, className = '', ...rest }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-ink mb-1.5">
          {label} {required && <span className="text-error-600">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{leftIcon}</span>
        )}
        <input
          ref={ref}
          className={`${baseField} h-12 ${leftIcon ? 'pl-11' : ''} ${rightIcon ? 'pr-11' : ''} ${error ? errorField : normalField} ${className}`}
          aria-invalid={!!error}
          {...rest}
        />
        {rightIcon && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">{rightIcon}</span>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-sm text-error-600">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  ),
);
Input.displayName = 'Input';
export default Input;

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldProps {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, options, placeholder, className = '', ...rest }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-ink mb-1.5">
          {label} {required && <span className="text-error-600">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`${baseField} h-12 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10 ${error ? errorField : normalField} ${className}`}
        aria-invalid={!!error}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-sm text-error-600">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  ),
);
Select.displayName = 'Select';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, className = '', ...rest }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-ink mb-1.5">
          {label} {required && <span className="text-error-600">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={`${baseField} py-3 ${error ? errorField : normalField} ${className}`}
        aria-invalid={!!error}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-sm text-error-600">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  ),
);
Textarea.displayName = 'Textarea';
