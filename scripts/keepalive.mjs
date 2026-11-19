const url = 'https://punto-maple-backend.onrender.com/api/health/ping';

try {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const body = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  console.log(`${new Date().toISOString()} keep-alive OK: ${body}`);
} catch (error) {
  console.error(`${new Date().toISOString()} keep-alive FALLÓ: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
