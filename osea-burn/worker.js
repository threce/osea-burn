/**
 * OSEA Burn - Open Source Edition (No TG)
 * * 部署指南:
 * 1. 在 Cloudflare 后台创建 R2 存储桶 (例如: burn-bucket)
 * 2. 在 Cloudflare 后台创建 KV 命名空间 (例如: burn-kv)
 * 3. 部署此 Worker，并在设置 (Settings) -> 变量 (Variables) 中绑定:
 * - R2 变量名: bucket
 * - KV 变量名: kv
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

function responseJSON(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // ⚠️ 配置：请在此处填入你的前端 Pages 域名，用于生成分享链接
      // 例如: https://burn.your-domain.com
      const FRONTEND_DOMAIN = 'https://YOUR_PAGES_DOMAIN.pages.dev'; 

      // --- 1. 状态查询 (9GB 限制) ---
      if (path === '/status') {
        const usageStr = await env.kv.get('SYSTEM_R2_USAGE') || '0';
        const usage = parseInt(usageStr);
        const limit = 9 * 1024 * 1024 * 1024; // 9GB 限额
        
        return responseJSON({
          usage: usage,
          usage_gb: (usage / (1024 * 1024 * 1024)).toFixed(2),
          percent: Math.min((usage / limit) * 100, 100).toFixed(1),
          full: usage >= limit
        });
      }

      // --- 2. 创建 (上传) ---
      if (path === '/create' && request.method === 'POST') {
        const usageStr = await env.kv.get('SYSTEM_R2_USAGE') || '0';
        const currentUsage = parseInt(usageStr);
        // 9GB 限制
        if (currentUsage >= 9 * 1024 * 1024 * 1024) return responseJSON({ error: 'Storage Limit Reached (9GB)' }, 403);

        const formData = await request.formData();
        const text = formData.get('text') || '';
        const files = formData.getAll('files'); 

        if (!text && files.length === 0) return responseJSON({ error: 'Empty content' }, 400);

        const userToken = crypto.randomUUID();
        const adminToken = crypto.randomUUID();
        const dataId = crypto.randomUUID();
        
        // 并发上传处理
        const uploadPromises = files.map(async (file) => {
            if (!(file instanceof File)) return null;
            if (file.size > 50 * 1024 * 1024) return null;

            // 使用 UUID 作为文件名，确保安全和无特殊字符问题
            const safeFileId = crypto.randomUUID(); 
            const fileKey = `${dataId}_${safeFileId}`; 

            await env.bucket.put(fileKey, file.stream(), {
                httpMetadata: { 
                    contentType: file.type,
                    // 存储原始文件名以便下载时恢复
                    contentDisposition: `inline; filename="${encodeURIComponent(file.name)}"` 
                }
            });

            return {
                key: fileKey,
                name: file.name,
                type: file.type,
                size: file.size
            };
        });

        const results = await Promise.all(uploadPromises);
        const savedFiles = results.filter(f => f !== null);
        const totalUploadSize = savedFiles.reduce((acc, f) => acc + f.size, 0);
        
        // 更新存储计数
        await env.kv.put('SYSTEM_R2_USAGE', (currentUsage + totalUploadSize).toString());

        const metaData = {
          text, 
          files: savedFiles, 
          createdAt: Date.now(), 
          userRead: false, 
          adminRead: false
        };

        // 写入数据库，有效期 24 小时 (86400秒)
        await env.kv.put(`DATA_${dataId}`, JSON.stringify(metaData), { expirationTtl: 86400 });
        await env.kv.put(`TOKEN_${userToken}`, JSON.stringify({ dataId, type: 'user' }), { expirationTtl: 86400 });
        await env.kv.put(`TOKEN_${adminToken}`, JSON.stringify({ dataId, type: 'admin' }), { expirationTtl: 86400 });

        const userLink = `${FRONTEND_DOMAIN}/#view=${userToken}`;

        return responseJSON({ link: userLink });
      }

      // --- 3. 访问 (阅后即焚) ---
      if (path === '/view' && request.method === 'GET') {
        const token = url.searchParams.get('token');
        if (!token) return responseJSON({ error: 'Missing token' }, 400);

        const tokenDataRaw = await env.kv.get(`TOKEN_${token}`);
        if (!tokenDataRaw) return responseJSON({ error: 'Link expired or destroyed' }, 404);

        const { dataId, type } = JSON.parse(tokenDataRaw);
        const metaRaw = await env.kv.get(`DATA_${dataId}`);
        if (!metaRaw) {
          // 数据如果已经没了，清理残留 Token
          await env.kv.delete(`TOKEN_${token}`);
          return responseJSON({ error: 'Content destroyed' }, 404);
        }

        let meta = JSON.parse(metaRaw);
        
        let fileList = [];
        if (meta.files && Array.isArray(meta.files)) {
            fileList = meta.files.map(f => ({
                url: `${url.origin}/file/${f.key}`,
                type: f.type,
                name: f.name
            }));
        }

        // 核心逻辑：访问即销毁 Token
        await env.kv.delete(`TOKEN_${token}`);
        
        // 更新阅读状态
        if (type === 'user') meta.userRead = true;
        if (type === 'admin') meta.adminRead = true;
        await env.kv.put(`DATA_${dataId}`, JSON.stringify(meta), { expirationTtl: 86400 });

        return responseJSON({
          text: meta.text,
          files: fileList,
          type: type
        });
      }

      // --- 4. 文件流 (下载/预览) ---
      if (path.startsWith('/file/')) {
        let key = path.replace('/file/', '');
        // 简单防御
        key = decodeURIComponent(key);

        const object = await env.bucket.get(key);
        if (!object) return new Response('File not found', { status: 404, headers: CORS_HEADERS });

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Access-Control-Allow-Origin', '*'); 
        headers.set('Cache-Control', 'private, max-age=3600');
        
        return new Response(object.body, { headers });
      }

      return responseJSON({ msg: 'OSEA Burn API Ready' });

    } catch (err) {
      return responseJSON({ error: err.message }, 500);
    }
  }
};