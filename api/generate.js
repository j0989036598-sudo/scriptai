{\rtf1\ansi\ansicpg950\cocoartf2867
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // \uc0\u27284 \u26696 \u20301 \u32622 \u65306 api/generate.js\
export default async function handler(req, res) \{\
  // \uc0\u21482 \u20801 \u35377  POST \u35531 \u27714 \
  if (req.method !== 'POST') \{\
    return res.status(405).json(\{ error: 'Method Not Allowed' \});\
  \}\
\
  try \{\
    const \{ system, userPrompt \} = req.body;\
\
    // \uc0\u20599 \u20599 \u24118 \u33879 \u24744 \u30340 \u37329 \u38000 \u21435 \u21839  AI (\u23458 \u20154 \u22312 \u32178 \u38913 \u19978 \u32085 \u23565 \u30475 \u19981 \u21040 \u37329 \u38000 )\
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', \{\
      method: 'POST',\
      headers: \{\
        'Content-Type': 'application/json',\
        'x-api-key': process.env.ANTHROPIC_API_KEY, // Vercel \uc0\u26371 \u33258 \u21205 \u24171 \u24744 \u22635 \u20837 \u36889 \u35041 \
        'anthropic-version': '2023-06-01'\
      \},\
      body: JSON.stringify(\{\
        model: 'claude-3-5-sonnet-20241022',\
        max_tokens: 4000,\
        system: system,\
        messages: [\{ role: 'user', content: userPrompt \}]\
      \})\
    \});\
\
    const data = await aiRes.json();\
    if (data.error) throw new Error(data.error.message);\
\
    const raw = data.content.map(b => b.text || '').join('');\
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());\
\
    // \uc0\u25226 \u33139 \u26412 \u20659 \u22238 \u32102 \u24744 \u30340  HTML \u32178 \u38913 \
    res.status(200).json(parsed);\
\
  \} catch (error) \{\
    console.error(error);\
    res.status(500).json(\{ error: '\uc0\u29983 \u25104 \u22833 \u25943 \u65292 \u35531 \u27298 \u26597 \u35373 \u23450 \u25110 \u31245 \u24460 \u20877 \u35430 \u12290 ' \});\
  \}\
\}}