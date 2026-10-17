#!/usr/bin/env node
// MCP server (stdio, JSON-RPC one message per line) for the playtest tools. No dependencies.
//   .mcp.json: { "mcpServers": { "playtest": { "command": "node", "args": ["tools/playtest/mcp.js"] } } }
const TOOLS = require('./tools.js');
const out = (m) => process.stdout.write(JSON.stringify(m) + '\n');
let buf = '';
process.stdin.on('data', (d) => {
  buf += d; let i;
  while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (line) handle(JSON.parse(line)); }
});
process.stdin.on('end', () => { try { require('./driver.js').stop(); } catch (e) {} process.exit(0); });

async function handle(m) {
  if (m.method === 'initialize') return out({ jsonrpc: '2.0', id: m.id, result: { protocolVersion: m.params && m.params.protocolVersion || '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'playtest', version: '1.0.0' } } });
  if (m.method === 'tools/list') return out({ jsonrpc: '2.0', id: m.id, result: { tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.schema })) } });
  if (m.method === 'tools/call') {
    const t = TOOLS.find((x) => x.name === m.params.name);
    if (!t) return out({ jsonrpc: '2.0', id: m.id, error: { code: -32601, message: 'no tool ' + m.params.name } });
    try {
      const r = await t.run(m.params.arguments || {});
      const content = t.image ? [{ type: 'image', data: r.data, mimeType: 'image/png' }, { type: 'text', text: 'saved ' + r.file }] : [{ type: 'text', text: String(r) }];
      return out({ jsonrpc: '2.0', id: m.id, result: { content } });
    } catch (e) {
      return out({ jsonrpc: '2.0', id: m.id, result: { content: [{ type: 'text', text: 'error: ' + (e && e.message || e) }], isError: true } });
    }
  }
  if (m.id != null) out({ jsonrpc: '2.0', id: m.id, result: {} }); // ping and anything else with an id
}
