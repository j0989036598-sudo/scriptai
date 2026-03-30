export default async function handler(req, res) {
  // 只允許 POST 請求
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { system, userPrompt } = req.body;
    
    // 1. 雙重檢查金鑰是否有讀到
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Vercel 沒抓到 API Key，請檢查 Environment Variables 是否有存好。');
    }

    // 2. 呼叫 Anthropic 最強大腦
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022', // 用最新最強的型號
        max_tokens: 4000,
        system: system || '你是專業的短影音腳本寫手',
        messages: [{ role: 'user', content: userPrompt || '請幫我寫一個腳本' }]
      })
    });

    const data = await aiRes.json();
    
    // 3. 攔截 Anthropic 的真實報錯（最重要的一步！）
    if (!aiRes.ok || data.error) {
      const errorMsg = data.error?.message || JSON.stringify(data);
      throw new Error(`Anthropic 官方報錯: ${errorMsg}`);
    }

    // 4. 精準提取 JSON
    let raw = data.content[0].text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 回傳的內容不是 JSON 格式');
    
    const parsed = JSON.parse(jsonMatch[0]);
    res.status(200).json(parsed);

  } catch (error) {
    console.error('後端詳細錯誤:', error);
    res.status(500).json({ error: error.message });
  }
}
