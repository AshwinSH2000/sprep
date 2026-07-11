// Inline SVGs matching Font Awesome's solid glyphs, sized via currentColor
// so they inherit whatever text color the caller applies.

export function FloppyDiskIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 448 512" fill="currentColor" className={className} aria-hidden="true">
      <path d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V163.9c0-17-6.7-33.3-18.7-45.3L352 18.7C340 6.7 323.7 0 306.7 0H64zm0 96c0-17.7 14.3-32 32-32H288c17.7 0 32 14.3 32 32v64c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V128zM224 288a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" />
    </svg>
  )
}

export function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" className={className} aria-hidden="true">
      <path d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.1L446.9 256l62.3 90.5c3.1 4.4 3.7 10.1 1.6 15.1s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.1-1.6L256 446.9l-90.5 62.3c-4.4 3.1-10.1 3.7-15.1 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.1L65.1 256 2.8 165.5c-3.1-4.4-3.7-10.1-1.6-15.1s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.1 1.6L256 65.1 346.5 2.8c4.4-3.1 10.1-3.7 15.1-1.6zM256 160a96 96 0 1 1 0 192 96 96 0 1 1 0-192z" />
    </svg>
  )
}

export function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" fill="currentColor" className={className} aria-hidden="true">
      <path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.3 1.4-18.9 2.2-28.7 2.2c-101.4 0-183.6-82.6-183.6-184.5c0-40.9 13.3-78.6 35.8-109.2c4.3-5.8 4.7-13.6 1-19.8s-10.7-9.7-17.9-8.6c-6.8 1.1-13.7 1.8-20.7 1.8z" />
    </svg>
  )
}
