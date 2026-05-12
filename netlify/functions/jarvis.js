// netlify/functions/jarvis.js
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Debug logging
  console.log('API key present:', !!apiKey);
  console.log('API key length:', apiKey ? apiKey.length : 0);
  console.log('Env keys available:', Object.keys(process.env).filter(k => !k.includes('npm')).join(', '));

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not set in Netlify environment variables.' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { system, messages } = body;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: system || 'You are JARVIS, a helpful assistant.',
        messages: messages || []
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || 'Claude API error' })
      };
    }

    const reply = data.content?.[0]?.text || 'No response received.';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error: ' + err.message })
    };
  }
};
