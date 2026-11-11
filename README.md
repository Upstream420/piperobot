

<h1>管道机器人控制系统</h1>

<h2>📋 项目简介</h2>
<p>一个基于 Web 的管道巡检机器人远程监控与控制系统，集成了实时视频流传输、SLAM 地图可视化、AI 智能分析、UDP 指令转发等功能。通过浏览器即可实时查看机器人巡检画面、控制机器人运动、分析管道缺陷，并借助 DeepSeek AI 进行智能诊断。</p>

<hr>

<h2>✨ 核心功能</h2>

<h3>🎥 实时视频监控</h3>
<ul>
  <li>通过 UDP 接收机器人端（Jetson）推送的 JPEG 视频帧</li>
  <li>基于 Socket.IO 实现浏览器端实时显示，带丢帧保护避免卡顿</li>
  <li>支持视频播放/暂停控制</li>
</ul>

<h3>🎮 远程控制</h3>
<ul>
  <li><strong>方向控制</strong>：前进、后退、左转、右转</li>
  <li><strong>任务控制</strong>：开始巡检、暂停、停止、返回基地</li>
  <li><strong>参数调节</strong>：速度滑块、灯光亮度调节</li>
  <li><strong>紧急停止</strong>：一键紧急制动</li>
  <li>所有指令通过 HTTP API → UDP 转发至 Jetson 设备</li>
</ul>

<h3>🗺️ SLAM 路径成像</h3>
<ul>
  <li>展示 SLAM 构建的管道二维地图视频</li>
  <li>地图构建进度、定位精度、已建模长度等状态监控</li>
  <li>手动播放控制</li>
</ul>

<h3>🤖 AI 智能分析助手</h3>
<ul>
  <li>集成 <strong>DeepSeek API</strong>，支持流式（SSE）对话响应</li>
  <li>可分析 SLAM 地图异常区域、解读缺陷风险等级、优化巡检路径</li>
  <li>支持快捷提问按钮，AI 回复逐字流式渲染</li>
</ul>

<h3>📊 数据可视化</h3>
<ul>
  <li>基于 <strong>Chart.js</strong> 的缺陷检测分析柱状图</li>
  <li>机器人状态实时折线图（速度、温度）</li>
  <li>实时传感器数据展示（温度、湿度、压力、氧气、甲烷、CO 含量）</li>
</ul>

<h3>📁 多视图管理</h3>
<ul>
  <li><strong>控制面板</strong>：核心监控与控制功能</li>
  <li><strong>历史记录</strong>：巡检任务与缺陷历史查询</li>
  <li><strong>路径成像</strong>：SLAM 地图 + AI 助手</li>
  <li>设备管理、报警管理、系统设置等视图（UI 预留）</li>
</ul>

<hr>

<h2>🛠️ 技术栈</h2>
<table>
  <thead>
    <tr><th>类别</th><th>技术</th></tr>
  </thead>
  <tbody>
    <tr><td>后端</td><td>Node.js + Express 5</td></tr>
    <tr><td>实时通信</td><td>Socket.IO 4</td></tr>
    <tr><td>前端</td><td>HTML5 + Tailwind CSS + Font Awesome</td></tr>
    <tr><td>图表</td><td>Chart.js 4</td></tr>
    <tr><td>视频播放</td><td>Video.js</td></tr>
    <tr><td>AI</td><td>DeepSeek API（流式 SSE）</td></tr>
    <tr><td>通信协议</td><td>UDP（dgram）+ HTTP</td></tr>
  </tbody>
</table>

<hr>

<h2>📦 安装与运行</h2>

<h3>环境要求</h3>
<ul>
  <li>Node.js &gt;= 18</li>
</ul>

<h3>安装依赖</h3>
<pre><code>npm install</code></pre>

<h3>配置环境变量</h3>
<p>在项目根目录创建 <code>.env</code> 文件：</p>
<pre><code>DEEPSEEK_API_KEY=your_deepseek_api_key</code></pre>

<h3>修改设备配置</h3>
<p>在 <code>server.js</code> 中修改 Jetson 设备地址：</p>
<pre><code>const JETSON_UDP_IP = '192.168.2.2';   // Jetson 局域网 IP
const JETSON_UDP_PORT = 4200;           // Jetson UDP 监听端口</code></pre>

<h3>启动服务</h3>
<pre><code>npm start</code></pre>
<p>访问 <code>http://localhost:3000</code> 即可打开控制面板。</p>

<hr>

<h2>🔌 通信架构</h2>
<pre><code>┌─────────────┐    JPEG/UDP    ┌──────────────┐   Socket.IO   ┌──────────┐
│   Jetson    │ ──────────────▶│  Node.js     │ ─────────────▶│  浏览器  │
│  (机器人)   │                 │  服务端      │               │  (前端)  │
│             │◀────────────── │              │◀───────────── │          │
└─────────────┘   UDP 指令      └──────────────┘   HTTP POST   └──────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │ DeepSeek API │
                              │  (AI 分析)   │
                              └──────────────┘</code></pre>

<h3>关键接口</h3>
<table>
  <thead>
    <tr><th>接口</th><th>说明</th></tr>
  </thead>
  <tbody>
    <tr><td><code>POST /udp-send</code></td><td>接收前端控制指令，通过 UDP 转发至 Jetson</td></tr>
    <tr><td><code>POST /api/chat</code></td><td>DeepSeek AI 流式代理接口</td></tr>
    <tr><td>Socket.IO <code>video-jpeg</code></td><td>服务端向前端推送视频帧</td></tr>
    <tr><td>Socket.IO <code>update-data</code></td><td>转发 Python 端上报的实时传感器数据</td></tr>
  </tbody>
</table>

<hr>

<h2>🎯 应用场景</h2>
<ul>
  <li>城市供暖/供水管道内部巡检</li>
  <li>工业管道缺陷检测与定位</li>
  <li>危险环境下的管道自动化排查</li>
  <li>管道维护作业的远程辅助决策</li>
</ul>

<hr>

<h2>📝 说明</h2>
<ul>
  <li>机器人端需运行 GStreamer 将视频编码为 JPEG 并通过 UDP 发送到服务端 <code>5003</code> 端口</li>
  <li>Python 端通过 Socket.IO 上报的传感器数据会实时同步到前端</li>
  <li>AI 分析功能需要有效的 DeepSeek API Key</li>
</ul>

<hr>

<h2>📄 License</h2>
<p>ISC</p>

<hr>

<blockquote>
  <p>💡 本项目为管道机器人监控系统的 Web 控制端实现，可配合机器人硬件端（Jetson + GStreamer + SLAM）组成完整的管道巡检解决方案。</p>
</blockquote>

</div>
</body>
</html>
