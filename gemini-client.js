const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent`;

function getGeminiKey() {
    return localStorage.getItem('verdct-gemini-key') || '';
}

function buildSystemPrompt(context) {
    return `You are Verdict Desk AI, a travel rights assistant for India covering flights, trains, buses, cabs, and hotels.
Key regulations:
- Flights: DGCA CAR Section 3 Series M Part IV (delays, cancellations, denied boarding, baggage)
- Trains: Indian Railways Refund Rules 2015, IRCTC policies
- Buses: State Motor Vehicles Rules, Consumer Protection Act 2019
- Cabs/Metro: Aggregator Guidelines, Consumer Protection Act 2019
- Hotels: Consumer Protection Act 2019, state tourism policies

Guidelines:
- Be concise (max 3 short paragraphs)
- Cite specific rules/sections when possible
- Give actionable next steps
- Never provide legal advice — add "Confirm with operator"
- Use plain English, no jargon

${context}

User question:`;
}

async function askGeminiStream(message, context, onChunk) {
    const apiKey = getGeminiKey();
    if (!apiKey) throw new Error('No API key configured');

    const systemPrompt = buildSystemPrompt(context);
    const fullPrompt = systemPrompt + "\n\nUser: " + message;

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;
            try {
                const data = JSON.parse(line.slice(6));
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) onChunk(text);
            } catch (e) {}
        }
    }
    
    if (buffer.trim() && buffer.startsWith('data: ')) {
        try {
            const data = JSON.parse(buffer.slice(6));
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) onChunk(text);
        } catch (e) {}
    }
}

async function askGemini(message, context) {
    const apiKey = getGeminiKey();
    if (!apiKey) throw new Error('No API key configured');

    const systemPrompt = buildSystemPrompt(context);
    const fullPrompt = systemPrompt + "\n\nUser: " + message;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function isGeminiConfigured() {
    return !!getGeminiKey();
}