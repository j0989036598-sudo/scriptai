export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { system, userPrompt } = req.body;
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        // 💡 換成 Haiku 大腦：速度超快、成本極低，且新帳號絕對可用！
        model: 'claude-3-haiku-20240307',
        max_tokens: 4000,
        system: system,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const data = await aiRes.json();
    
    // 捕捉 Anthropic 給的真實錯誤訊息
    if (data.error) throw new Error(data.error.message || 'AI 拒絕連線');

    // 提取內容並確保它是乾淨的 JSON
    let raw = data.content[0].text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 回傳格式無法解析');
    
    const parsed = JSON.parse(jsonMatch[0]);
    res.status(200).json(parsed);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
