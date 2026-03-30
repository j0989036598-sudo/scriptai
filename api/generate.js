export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { system, userPrompt } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) throw new Error('Vercel 沒抓到 API Key');

    // 🌟 第一重保險：嚴厲警告 AI 絕對不能寫錯格式
    const enhancedSystem = (system || '') + `
\n\n【非常重要：JSON 格式嚴格規定】
1. 絕對不能有任何 markdown 標記 (如 \`\`\`json)。
2. 陣列 (Array) 和物件 (Object) 的最後一個元素後面「絕對不能」有逗號 (Trailing comma)。
3. 對話或內容中若出現雙引號 (") 必須替換為單引號 (')，或者嚴格使用反斜線跳脫 (\\")。
4. 必須輸出完整、閉合的 JSON。`;

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000, // ✅ 關鍵修復：乖乖改回官方允許的安全極限值 4000！
        system: enhancedSystem,
        messages: [{ role: 'user', content: userPrompt || '請幫我寫一個腳本' }]
      })
    });

    const data = await aiRes.json();
    
    if (!aiRes.ok || data.error) {
      const errorMsg = data.error?.message || JSON.stringify(data);
      throw new Error(`${errorMsg}`);
    }

    let raw = data.content[0].text;
    
    // 🌟 第二重保險：後端自動洗掉 AI 偶爾手殘寫錯的格式
    raw = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 回傳格式無法解析');
    
    let jsonString = jsonMatch[0];
    // 自動修復：把陣列或物件結尾多餘的逗號偷偷刪掉，避免網頁解析失敗
    jsonString = jsonString.replace(/,\s*([\]}])/g, '$1');
    
    const parsed = JSON.parse(jsonString);
    res.status(200).json(parsed);

  } catch (error) {
    console.error('後端詳細錯誤:', error);
    res.status(500).json({ error: error.message });
  }
}
