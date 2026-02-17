<div align="center">

# 🔥 OSEA Burn
### 阅后即焚 · 隐私安全

[👉 **在线演示 (Live Demo)**](https://burn.osea.cloud/)

</div>

---

## 📖 项目介绍

**OSEA Burn** 是一个基于 Cloudflare 强大生态（Workers, R2, KV, Pages）构建的轻量级文件分享工具。

它专为**安全**与**隐私**设计。所有上传的文件和文本在被访问一次后，会立即从服务器上物理销毁，不可恢复。整个系统无需服务器（Serverless），无需复杂的后端维护，前端仅需一个 HTML 文件即可运行。

## ✨ 核心功能

* 🔥 **阅后即焚**：链接访问一次即失效，数据随即永久清除。
* ☁️ **无服务器架构**：完全基于 Cloudflare，免费、快速、高可用。
* 🔒 **隐私优先**：无日志记录，文件名采用 UUID 重命名存储，杜绝元数据泄露。
* ⚡ **极速并发**：支持多文件并发上传，大文件秒传体验。
* 🛡️ **配额保护**：内置 9GB 存储熔断机制，防止滥用 R2 免费额度。
* 🎨 **极简设计**：黑白高冷 UI，自适应深色模式，极致丝滑。

---

## 🛠️ 部署指南

无需服务器，无需安装 Node.js，只需一个 Cloudflare 账号。

### 第一步：后端部署 (Worker)

1.  登录 Cloudflare Dashboard，创建 **R2 存储桶** (例如命名为 `osea-burn-bucket`)。
    * *建议设置对象生命周期规则：1天后自动删除，防止意外残留。*
2.  创建 **KV 命名空间** (例如命名为 `osea-burn-kv`)。
3.  创建 **Worker** 服务，将本项目中的 `worker.js` 代码粘贴进去。
4.  在 Worker 的 **Settings (设置)** -> **Variables (变量)** 中绑定资源：
    * KV 命名空间绑定为变量名：`kv`
    * R2 存储桶绑定为变量名：`bucket`
5.  **部署** 并获取 Worker 的访问域名 (例如 `https://xxx.workers.dev`)。

### 第二步：前端部署 (Pages)

1.  下载本项目中的 `index.html`。
2.  使用编辑器打开，修改底部的配置：
    ```javascript
    // 将此处修改为你第一步部署的 Worker 域名
    const API_BASE = 'https://你的Worker域名.workers.dev';
    ```
3.  在 Cloudflare 中进入 **Workers & Pages** -> **Create application** -> **Pages** -> **Upload assets**。
4.  上传包含 `index.html` 的文件夹。
5.  部署完成！

---

## 📸 界面预览

| 深色模式 | 浅色模式 |
| :---: | :---: |
| *<img width="2537" height="1169" alt="image" src="https://github.com/user-attachments/assets/55308178-a775-47a5-a46a-1ff770d60fe5" />
* | *<img width="2556" height="1170" alt="image" src="https://github.com/user-attachments/assets/1bc05adb-701c-4daa-82ac-4e54bf0821fd" />
* |


---

## 📝 开源协议

本项目采用 [MIT License](LICENSE) 开源。
这意味着你可以免费使用、复制、修改和分发本项目，只需保留原作者版权声明。

Copyright (c) 2026 OSEA Cloud Systems
