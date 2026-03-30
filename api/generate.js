// 檔案位置：api/generate.js
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
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: system,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const data = await aiRes.json();
    if (data.error) throw new Error(data.error.message);

    // 💡 吳懂，這段過濾器非常重要，它會踢掉 AI 說的廢話，只留下腳本 JSON
    let raw = data.content.map(b => b.text || '').join('');
    const jsonMatch = raw.match(/\{[\s\S]*\}/); // 尋找大括號內容
    if (!jsonMatch) throw new Error('AI 回傳格式錯誤');
    
    const parsed = JSON.parse(jsonMatch[0]);
    res.status(200).json(parsed);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
