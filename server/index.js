import http from 'node:http';
import app from './app.js';
import { getSupabaseStatus } from './db/supabase.js';

const PORT = parseInt(process.env.BACKEND_PORT || '5001', 10);

const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  const supabase = getSupabaseStatus();
  console.log(`
================================================================================
🏛️  CBFIS SOVEREIGN FORENSIC BACKEND ONLINE
================================================================================
Port:         http://0.0.0.0:${PORT}
API Health:   http://localhost:${PORT}/api/health
Database:     ${supabase.mode}
Supabase:     ${supabase.configured ? 'CONNECTED (Cloud PostgreSQL)' : 'OFFLINE (Local File Persistence: server/data/db.json)'}
Authority:    Ministry of Home Affairs (I4C) Government of India
================================================================================
  `);
});

process.on('SIGINT', () => {
  console.log('\n[CBFIS] Gracefully shutting down sovereign backend...');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
