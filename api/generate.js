export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { system, userPrompt } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) throw new Error('Vercel 沒抓到 API Key');

    // 呼叫 Anthropic，這次使用最新版大腦！
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6', // 🌟 關鍵修正：換成當前最新的 4.6 版大腦
        max_tokens: 4000,
        system: system || '你是專業的短影音腳本寫手',
        messages: [{ role: 'user', content: userPrompt || '請幫我寫一個腳本' }]
      })
    });

    const data = await aiRes.json();
    
    // 攔截 Anthropic 報錯
    if (!aiRes.ok || data.error) {
      const errorMsg = data.error?.message || JSON.stringify(data);
      throw new Error(`Anthropic 報錯: ${errorMsg}`);
    }

    // 提取乾淨的 JSON
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
