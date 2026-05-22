const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const ZHIPU_API_KEY = '3d13c85a598545139fe0e32b0fc719c8.ld0tYqbt9LP094LZ';
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

app.post('/api/ai', async (req, res) => {
  try {
    const { messages } = req.body;
    await new Promise(r => setTimeout(r, 1000));
    const response = await fetch(ZHIPU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZHIPU_API_KEY}`
      },
      body: JSON.stringify({ model: 'glm-4.7-flash', messages, temperature: 0.7, max_tokens: 2048 })
    });
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    res.json({ choices: [{ message: { content: data.choices[0].message.content } }] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/', (req, res) => res.send('✅ 个人主页后端已正常运行'));
app.listen(process.env.PORT || 3000);
