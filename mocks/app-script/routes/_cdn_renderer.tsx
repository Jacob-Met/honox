import { jsxRenderer } from 'hono/jsx-renderer'
import { Script } from '../../../src/server'

export default jsxRenderer(
  ({ children }) => (
    <html>
      <head>
        <Script
          src='/app/client.ts'
          prod={true}
          baseUrl='https://cdn.example.com/honox'
          manifest={{ 'app/client.ts': { file: 'static/client-abc.js' } }}
        />
      </head>
      <body>{children}</body>
    </html>
  ),
  { docType: false }
)
