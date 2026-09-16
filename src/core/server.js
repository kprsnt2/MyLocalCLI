import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    getProvider,
    getModel,
    getApiKey,
    getBaseUrl,
    setProvider,
    setModel,
    setApiKey
} from '../config/settings.js';
import { PROVIDERS } from '../config/providers.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIR = path.join(__dirname, '..', '..', 'web');

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

export function startWebServer(options = {}) {
    const port = options.port || 3456;
    const host = options.host || 'localhost';

    const server = http.createServer(async (req, res) => {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        // Config API endpoint
        if (req.url === '/api/config') {
            if (req.method === 'GET') {
                const current = getProvider();
                const providerData = {};
                for (const [key, p] of Object.entries(PROVIDERS)) {
                    providerData[key] = {
                        name: p.name,
                        endpoint: getBaseUrl(key),
                        model: getModel(key),
                        hasKey: !!getApiKey(key)
                    };
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    provider: current,
                    model: getModel(current),
                    endpoint: getBaseUrl(current),
                    hasApiKey: !!getApiKey(current),
                    providers: providerData
                }));
                return;
            }

            if (req.method === 'POST') {
                let body = '';
                for await (const chunk of req) body += chunk;
                try {
                    const data = JSON.parse(body);
                    if (data.provider) setProvider(data.provider);
                    if (data.model) setModel(data.provider || getProvider(), data.model);
                    if (data.apiKey) setApiKey(data.provider || getProvider(), data.apiKey);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } catch (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
                }
                return;
            }
        }

        // Proxy requests
        if (req.url.startsWith('/proxy/')) {
            return handleProxy(req, res);
        }
        // Static files
        let filePath = path.join(WEB_DIR, req.url === '/' ? 'index.html' : req.url);
        const ext = path.extname(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        try {
            const content = await fs.promises.readFile(filePath);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        } catch (error) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    });

    server.listen(port, host, () => {
        console.log(`\n🌐 Web UI running at http://${host}:${port}\n`);
    });

    return server;
}

async function handleProxy(req, res) {
    try {
        // Decode target URL
        const urlPart = req.url.slice(7); // Remove '/proxy/'
        let targetUrl;

        try {
            targetUrl = Buffer.from(urlPart, 'base64').toString('utf-8');
        } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid URL encoding' }));
            return;
        }

        console.log(`[Proxy] ${req.method} -> ${targetUrl}`);

        // Collect request body
        let body = '';
        for await (const chunk of req) {
            body += chunk;
        }

        // Build headers
        const headers = {
            'Content-Type': 'application/json'
        };

        // Forward Authorization header if present, or inject from system settings
        if (req.headers.authorization) {
            headers['Authorization'] = req.headers.authorization;
        } else {
            // Auto-inject system API key if available
            if (targetUrl.includes('openrouter.ai')) {
                const k = getApiKey('openrouter');
                if (k) headers['Authorization'] = `Bearer ${k}`;
            } else if (targetUrl.includes('integrate.api.nvidia.com')) {
                const k = getApiKey('nvidia');
                if (k) headers['Authorization'] = `Bearer ${k}`;
            } else if (targetUrl.includes('api.groq.com')) {
                const k = getApiKey('groq');
                if (k) headers['Authorization'] = `Bearer ${k}`;
            } else if (targetUrl.includes('api.openai.com')) {
                const k = getApiKey('openai');
                if (k) headers['Authorization'] = `Bearer ${k}`;
            }
        }

        if (targetUrl.includes('openrouter.ai')) {
            headers['HTTP-Referer'] = 'https://mlc.kprsnt.in';
            headers['X-Title'] = 'MyLocalCLI';
        }
        // Make proxied request
        const fetchOptions = {
            method: req.method,
            headers
        };

        // Add body for POST requests
        if (req.method === 'POST' && body) {
            fetchOptions.body = body;
            console.log(`[Proxy] Body length: ${body.length}`);
        }

        const response = await fetch(targetUrl, fetchOptions);
        const responseText = await response.text();

        console.log(`[Proxy] Response: ${response.status} (${responseText.length} bytes)`);

        res.writeHead(response.status, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(responseText);

    } catch (error) {
        console.error('[Proxy] Error:', error.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
    }
}

export default { startWebServer };
