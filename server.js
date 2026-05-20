const express = require("express");
const fetch = require("node-fetch");

const app = express();

app.use(express.json({ limit: "50mb" }));

// 你的 Cloudflare Worker
const WORKER_URL =
  "https://你的workers地址.workers.dev/";


// 读取主页数据
app.get("/load", async (req, res) => {
  try {
    const r = await fetch(WORKER_URL);
    const d = await r.text();

    res.setHeader("Content-Type", "application/json");
    res.send(d);
  } catch (e) {
    res.status(500).send({
      success: false,
      error: e.toString()
    });
  }
});


// 保存主页数据
app.post("/save", async (req, res) => {
  try {
    const r = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": "mypage123"
      },
      body: JSON.stringify(req.body)
    });

    const d = await r.text();

    res.send(d);
  } catch (e) {
    res.status(500).send({
      success: false,
      error: e.toString()
    });
  }
});


// 视频解析
app.get("/video", async (req, res) => {
  try {
    const url = req.query.url;

    if (!url) {
      return res.send({
        success: false,
        error: "缺少url"
      });
    }

    const api =
      "https://api.5ikf.top/api/jmp?dm=sy858&key=82743b1715e2496ed8b7b06454d7494e&url=" +
      encodeURIComponent(url);

    const r = await fetch(api);

    const d = await r.text();

    res.setHeader("Content-Type", "application/json");
    res.send(d);

  } catch (e) {
    res.status(500).send({
      success: false,
      error: e.toString()
    });
  }
});


app.listen(process.env.PORT || 3000, () => {
  console.log("API RUNNING");
});
