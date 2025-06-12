export default function assert(condition: unknown, msg?: string | Error): asserts condition {
  if (condition) {
    return
  }

  if (msg instanceof Error) {
    throw msg
  }

  throw new Error(msg ?? 'Assertion failed')
}