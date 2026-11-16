import { jsxRenderer } from 'hono/jsx-renderer'
import { Link } from '../../../src/server'

export default jsxRenderer(
  ({ children }) => (
    <html>
      <head>
        <Link
          href='/app/globals.css'
          rel='stylesheet'
          prod={true}
          baseUrl='https://cdn.example.com/honox'
          manifest={{ 'app/globals.css': { file: 'static/globals-abc.css' } }}
        />
        <Link
          href='app/global-relative.css'
          rel='stylesheet'
          prod={true}
          baseUrl='https://cdn.example.com/honox/'
          manifest={{ 'app/global-relative.css': { file: 'static/relative-abc.css' } }}
        />
      </head>
      <body>{children}</body>
    </html>
  ),
  { docType: false }
)
