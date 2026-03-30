export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { system, userPrompt } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) throw new Error('Vercel 沒抓到 API Key');

    // 嚴格格式規定
    const enhancedSystem = (system || '') + `
\n\n【非常重要：JSON 格式嚴格規定】
1. 絕對不能有任何 markdown 標記 (如 \`\`\`json)。
2. 陣列 (Array) 和物件 (Object) 的最後一個元素後面「絕對不能」有逗號 (Trailing comma)。
3. 對話或內容中若出現雙引號 (") 必須替換為單引號 (')。
4. 必須輸出完整、閉合的 JSON。`;

    // 🌟 打造一個「專屬呼叫器」函數，方便隨時切換大腦
    async function fetchClaude(modelName) {
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 2500, // 安全字數
          system: enhancedSystem,
          messages: [{ role: 'user', content: userPrompt || '請幫我寫一個腳本' }]
        })
      });
      const data = await aiRes.json();
      if (!aiRes.ok || data.error) {
         throw new Error(data.error?.message || JSON.stringify(data));
      }
      return data;
    }

    let data;
    try {
      // 🚀 第一階段：呼叫最穩定的 Claude 3.5 Sonnet
      data = await fetchClaude('claude-3-5-sonnet-20240620');
    } catch (err1) {
      console.log('Sonnet 塞車中，系統自動無縫切換備援引擎...', err1.message);
      try {
        // 🚀 第二階段：如果 Sonnet 罷工，零秒切換到速度最快的 Haiku，確保客人一定拿得到腳本！
        data = await fetchClaude('claude-3-haiku-20240307');
      } catch (err2) {
        throw new Error('目前 AI 伺服器大塞車，請稍等 30 秒後再按一次喔！');
      }
    }

    // 後端自動洗掉錯字與標點符號
    let raw = data.content[0].text;
    raw = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 格式跑掉啦，請再按一次生成');
    
    let jsonString = jsonMatch[0].replace(/,\s*([\]}])/g, '$1'); // 自動修復結尾逗號
    
    const parsed = JSON.parse(jsonString);
    res.status(200).json(parsed);

  } catch (error) {
    console.error('後端詳細錯誤:', error);
    res.status(500).json({ error: error.message });
  }
}
