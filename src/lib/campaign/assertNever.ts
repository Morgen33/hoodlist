export function assertNever(value: never, message?: string): never {
  throw new Error(message ?? `Unhandled campaign rule: ${String(value)}`);
}
