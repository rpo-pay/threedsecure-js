export class Bucket<T> {
  private error: Error | null = null
  private next: [(item: T) => void, (error: Error) => void] | null = null
  private readonly bucket: AsyncIterableIterator<T>
  private readonly abort: AbortController

  constructor(private readonly stack: Array<T> = []) {
    this.abort = new AbortController()
    this.bucket = this.createBucket() as AsyncIterableIterator<T>
  }

  get iterator(): AsyncIterableIterator<T> {
    return this.bucket
  }

  close() {
    this.abort.abort()
  }

  push(item: T) {
    if (this.abort.signal.aborted) {
      throw new Error('Bucket is aborted')
    }
    if (!this.next) {
      this.stack.push(item)
      return
    }
    const [resolve, _] = this.next
    resolve(item)
    this.next = null
  }

  pushError(error: Error) {
    this.error = error
  }

  private async *createBucket() {
    while (!this.abort.signal.aborted) {
      yield new Promise<T>((resolve, reject) => {
        if (!this.stack.length) {
          this.next = [resolve, reject]
          return
        }
        const item = this.stack.shift() as T
        resolve(item)
      })

      if (this.error) {
        yield Promise.reject(this.error)
        this.error = null
      }
    }

    if (this.error) {
      yield Promise.reject(this.error)
      this.error = null
    }
  }
}
