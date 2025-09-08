// Global type declarations

declare global {
  interface Window {
    va?: {
      track: (event: string, properties?: Record<string, any>) => void
    }
  }
}

export {}