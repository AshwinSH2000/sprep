import ReactMarkdown from 'react-markdown'

// Renders raw Markdown entry bodies (Phase 13). react-markdown does NOT render
// embedded raw HTML unless rehype-raw is added — which we deliberately omit —
// so user-authored content can't inject scripts (XSS-safe by construction).
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown text-sm text-text-secondary">
      <ReactMarkdown
        components={{
          a: ({ ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noreferrer noopener"
              className="text-accent hover:text-accent-hover underline"
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
