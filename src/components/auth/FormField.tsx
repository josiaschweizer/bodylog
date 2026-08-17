import type { ComponentPropsWithoutRef } from 'react'

type FormFieldProps = ComponentPropsWithoutRef<'input'> & {
  label: string
  error?: string
}

export default function FormField({
  label,
  error,
  id,
  className = '',
  ...inputProps
}: FormFieldProps) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-semibold text-ash-brown-800">{label}</span>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-base text-ash-brown-950 outline-none transition placeholder:text-dusty-taupe-400 focus:ring-4 ${
          error
            ? 'border-chocolate-plum-500 focus:border-chocolate-plum-600 focus:ring-chocolate-plum-100'
            : 'border-dusty-taupe-300 focus:border-chocolate-plum-500 focus:ring-chocolate-plum-100'
        } ${className}`}
        {...inputProps}
      />
      {error ? (
        <span id={`${id}-error`} className="mt-1.5 block text-sm text-chocolate-plum-700">
          {error}
        </span>
      ) : null}
    </label>
  )
}
