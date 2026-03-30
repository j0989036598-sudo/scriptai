export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { system, userPrompt } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) throw new Error('Vercel 沒抓到 API Key');

    const enhancedSystem = (system || '') + `
\n\n【非常重要：JSON 格式嚴格規定】
1. 絕對不能有任何 markdown 標記 (如 \`\`\`json)。
2. 陣列和物件的最後一個元素後面「絕對不能」有逗號。
3. 對話或內容中若出現雙引號 (") 必須替換為單引號 (')。
4. 必須輸出完整、閉合的 JSON。`;

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022', // 回歸最強大腦
        max_tokens: 2500,
        system: enhancedSystem,
        messages: [{ role: 'user', content: userPrompt || '請幫我寫一個腳本' }]
      })
    });

    const data = await aiRes.json();
    
    // 🚨 這次我們不藏了！Anthropic 說什麼，我們就直接顯示什麼！
    if (!aiRes.ok || data.error) {
       const errorMsg = data.error?.message || JSON.stringify(data);
       throw new Error(`【官方真實報錯】: ${errorMsg}`);
    }

    let raw = data.content[0].text;
    raw = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 格式跑掉啦，請再按一次生成');
    
    let jsonString = jsonMatch[0].replace(/,\s*([\]}])/g, '$1'); 
    
    const parsed = JSON.parse(jsonString);
    res.status(200).json(parsed);

  } catch (error) {
    console.error('後端詳細錯誤:', error);
    res.status(500).json({ error: error.message });
  }
}
