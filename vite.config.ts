import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Vite config — https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const emitSourcemaps = mode === 'development'

  return {
    base: '/',
    build: {
      sourcemap: emitSourcemaps ? 'inline' : false,
      minify: !emitSourcemaps,
    },
    plugins: [
      react(),
      tailwindcss(),
      cbfisApiPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '8443'),
      strictPort: true,
    },
    preview: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '8443'),
    },
  }
})

/**
 * Mounts the CBFIS Sovereign LEA Express Backend directly onto Vite's dev server middleware.
 * All requests to /api/* are intercepted and served by Express, enabling dual-mode execution
 * on the exact same port (8443) without CORS issues or secondary processes.
 */
function cbfisApiPlugin(): Plugin {
  const handler = async (req: any, res: any, next: any) => {
    const url = req.url || ''
    if (url.startsWith('/api/') || url === '/api') {
      try {
        // @ts-ignore
        const { default: apiApp } = await import('./server/app.js')
        return apiApp(req as any, res as any, next)
      } catch (err) {
        console.error('[CBFIS API Middleware Error]:', err)
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        return res.end(JSON.stringify({ error: 'Internal Server API Error', details: (err as any)?.message }))
      }
    }
    next()
  }

  return {
    name: 'cbfis-api-plugin',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}
