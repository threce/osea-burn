# osea-burn
部署在Cloudflare Workers&Pages上的阅后即焚小工具支持图片视频音频
🔥 OSEA Burn - 极简阅后即焚文件分享系统
OSEA Burn 是一个基于 Cloudflare Workers (无服务器计算)、R2 (对象存储) 和 KV (键值数据库) 构建的轻量级、安全、开源的“阅后即焚”文件分享工具。

它是为了极简部署而设计的：

❌ 不需要服务器 (VPS)

❌ 不需要安装 Node.js 或复杂的构建工具

✅ 只需要一个 Cloudflare 账号

✅ 前端仅需一个 HTML 文件

✨ 主要功能
阅后即焚: 链接被访问一次后，数据立即从数据库和存储桶中物理删除，不可恢复。

安全存储: 文件名使用 UUID 重命名存储，彻底杜绝特殊字符导致的问题。

多文件支持: 支持同时拖拽上传多个图片、视频或音频。

并发上传: 极速上传体验，大文件也能轻松处理。

存储限制: 内置 9GB 存储上限保护（防止滥用免费额度）。

极简 UI: 黑白高冷风格，支持深色模式，移动端完美适配。

隐私保护: 无日志，无追踪。

🛠️ 部署指南 (保姆级教程)
本教程分为两个部分：后端 (Worker) 和 前端 (Pages)。请按顺序操作。

准备工作
注册一个 Cloudflare 账号。

确保你有一个 GitHub 账号（用于存放代码）。

第一部分：后端部署 (Worker + R2 + KV)
后端负责处理逻辑和存储文件。

1. 创建存储桶 (R2)
登录 Cloudflare 仪表盘，点击左侧菜单的 R2。

点击 Create bucket (创建存储桶)。

名称填写：osea-burn-bucket (或者你自己喜欢的名字)。

点击 Create bucket。

重要: 点击 Settings (设置) -> 下滑找到 Object lifecycle rules (生命周期规则) -> Add rule。

Rule name: Auto Delete

设置: Delete objects -> After 1 days (为了防止意外残留，设置1天后自动物理删除)。

点击 Create rule。

2. 创建数据库 (KV)
点击左侧菜单的 Workers & Pages -> KV。

点击 Create a namespace。

名称填写：osea-burn-kv。

点击 Add。

3. 创建 Worker 服务
点击左侧菜单的 Workers & Pages -> Overview -> Create application。

点击 Create Worker。

Name 填写：osea-burn-api。

点击 Deploy (先部署一个默认的，不用管代码)。

部署成功后，点击 Edit code。

复制本项目中的 worker.js 代码，完全覆盖编辑器里的内容。

点击右上角的 Deploy。

4. 绑定变量 (最关键的一步！⚠️)
代码部署了，但它还不知道去哪里存文件，所以要绑定刚才创建的 R2 和 KV。

回到 Worker 的配置页面 (点击左上角的名称返回)。

点击 Settings (设置) -> Variables (变量)。

找到 KV Namespace Bindings:

点击 Add binding。

Variable name (变量名) 必须填写: kv (必须小写，不能错)。

KV Namespace 选择你刚才创建的: osea-burn-kv。

找到 R2 Bucket Bindings:

点击 Add binding。

Variable name (变量名) 必须填写: bucket (必须小写，不能错)。

R2 Bucket 选择你刚才创建的: osea-burn-bucket。

点击 Deploy (或者 Save and Deploy) 保存设置。

🎉 后端部署完成！
在 Worker 页面找到你的 Preview URL (例如 https://osea-burn-api.你的名字.workers.dev)，复制下来，下一步要用。

第二部分：前端部署 (Pages)
前端是用户看到的网页界面。

1. 修改配置文件
下载本项目中的 index.html 文件到你的电脑。

使用记事本或代码编辑器打开 index.html。

拉到文件最底部，找到以下代码：

JavaScript
// ⚠️ 部署配置 (使用者必须修改此处)
const API_BASE = 'https://YOUR_WORKER_DOMAIN.workers.dev';
将 'https://YOUR_WORKER_DOMAIN.workers.dev' 修改为你后端部署步骤中获得的 Worker URL。

注意：不要带结尾的 /，例如 https://osea-burn-api.xxx.workers.dev。

保存文件。

2. 上传到 Cloudflare Pages
回到 Cloudflare 仪表盘，点击 Workers & Pages -> Create application。

点击 Pages 标签 -> Upload assets (直接上传资源)。

Project name 填写：osea-burn。

点击 Create project。

将你修改好的 index.html 文件所在的文件夹拖拽上传。

点击 Deploy site。

🎉 大功告成！
点击 Pages 提供的链接（例如 https://osea-burn.pages.dev），你的阅后即焚网站已经可以使用了！

❓ 常见问题 (FAQ)
Q: 上传时提示 "Storage Limit Reached"?
A: 系统内置了 9GB 的保护限制。如果你的 R2 存储用量超过 9GB，系统会自动禁止上传。你可以在 R2 后台手动清空文件，或者等待 KV 中的计数器重置。

Q: 如何修改网站标题或页脚？
A: 直接编辑 index.html 文件，搜索对应的文字（如 "OSEA BURN"）进行修改即可。

⚠️ 免责声明
本项目仅供学习和技术交流使用。请勿用于存储违反当地法律法规的内容。开发者不对使用本项目产生的任何后果负责。
