export type IFrameEvents = {
  onCreate?: (iframe: HTMLIFrameElement) => void
  onRemove?: (iframe: HTMLIFrameElement) => void
  onAppend?: (iframe: HTMLIFrameElement) => void
  onLoad?: (iframe: HTMLIFrameElement) => void
  onError?: (iframe: HTMLIFrameElement) => void
}
