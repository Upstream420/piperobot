// --------------------------------------
// server.js  (保留原有功能 + 添加UDP转发功能)
// --------------------------------------
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dgram = require('dgram');
const cors = require('cors');
const dotenv = require('dotenv');
const { Readable } = require('node:stream');

dotenv.config();

const HTTP_PORT = 3000;   // 浏览器访问端口
const UDP_PORT  = 5003;   // 接收 GStreamer 的 UDP 端口
// 添加Jetson配置 - 请修改为你的Jetson设备IP和端口
const JETSON_UDP_IP = '192.168.2.2';  // Jetson的局域网IP
const JETSON_UDP_PORT = 4200;           // Jetson监听的UDP端口

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// 创建UDP客户端用于向Jetson发送数据
const jetsonUdpClient = dgram.createSocket('udp4');

// 静态托管 index.html
app.use(express.static(__dirname));
app.use(cors());
app.use(express.json());

// ==========================
// 新增：处理前端发送的"1"并转发到Jetson
// ==========================
app.post('/udp-send', (req, res) => {
  try {
    // 接收前端发送的数据（预期是1）
    const data = req.body;
    console.log('收到前端数据:', data);

    // 转换为Buffer并发送到Jetson
    const dataBuffer = Buffer.from(JSON.stringify(data));
    jetsonUdpClient.send(
      dataBuffer,
      JETSON_UDP_PORT,
      JETSON_UDP_IP,
      (err) => {
        if (err) {
          console.error('向Jetson发送UDP失败:', err);
          res.status(500).json({ status: 'failed', error: '发送到Jetson失败' });
        } else {
          console.log('已向Jetson发送数据:', data);
          res.json({ status: 'success' });
        }
      }
    );
  } catch (err) {
    console.error('处理发送请求出错:', err);
    res.status(500).json({ status: 'failed', error: '服务器内部错误' });
  }
});

// ==========================
// 原有功能：UDP接收JPEG帧
// ==========================
const udp = dgram.createSocket('udp4');
udp.on('message', (msg) => {
  io.emit('video-jpeg', msg.toString('base64'));
});
udp.on('listening', () => {
  const addr = udp.address();
  console.log(`UDP listening on ${addr.address}:${addr.port}`);
});
udp.bind(UDP_PORT);

// ==========================
// 原有功能：Socket.IO通信
// ==========================
io.on('connection', (socket) => {
  socket.emit('port-info', { udpPort: UDP_PORT });

  socket.on('update-data', (data) => {
    console.log('📡 收到 Python 数据:', data);
    io.emit('update-data', data);
  });
});

// ==========================
// 原有功能：DeepSeek 代理
// ==========================
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, temperature = 0.7, max_tokens = 1000, model = 'deepseek-chat' } = req.body || {};

    const controller = new AbortController();
    const upstream = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: messages || [],
        temperature,
        max_tokens
      }),
      signal: controller.signal
    });

    if (!upstream.ok) {
      const txt = await upstream.text().catch(() => '');
      res.status(upstream.status).type('text/plain; charset=utf-8').send(txt || `Upstream error: ${upstream.status}`);
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const nodeStream = Readable.fromWeb(upstream.body);

    nodeStream.on('data', (chunk) => {
      res.write(chunk);
    });

    nodeStream.on('end', () => {
      res.end();
    });

    nodeStream.on('error', (err) => {
      console.error('Stream error', err);
      try { res.end(); } catch {}
    });

    req.on('close', () => {
      try { controller.abort(); } catch {}
      try { nodeStream.destroy(); } catch {}
    });

  } catch (err) {
    console.error('Stream error', err);
    try { res.end(); } catch {}
  }
});

// ==========================
// 启动服务
// ==========================
server.listen(HTTP_PORT, () => {
  console.log(`Open http://localhost:${HTTP_PORT}`);
  console.log(`UDP转发配置: 目标Jetson ${JETSON_UDP_IP}:${JETSON_UDP_PORT}`);
});