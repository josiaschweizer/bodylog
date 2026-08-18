# Development workflow

- Always use braces for control statements. Never place an `if` body on the same line as its condition.
- Treat every UI change as mobile-first. Verify layouts at 320 px width, prevent horizontal overflow, and ensure every form control stays within its container.
- Before completing any code change, run `pnpm format`.
- After formatting, run `pnpm lint` and `pnpm build` to verify the result.
