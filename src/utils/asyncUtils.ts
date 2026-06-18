export function withTimeout<T>(promise: Promise<T>, label: string = "request", timeoutMs: number = 12000): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs)
  })

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}
