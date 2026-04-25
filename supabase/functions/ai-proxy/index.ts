// supabase/functions/ai-proxy/index.ts
// Proxies AI calls to Groq (primary) + OpenAI (fallback)
// API keys stored securely as Supabase Edge Function secrets

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const GROQ_KEY = Deno.env.get('GROQ_API_KEY')
const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function callGroq(prompt: string, maxTokens = 300): Promise<string | null> {
  if (!GROQ_KEY) return null
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.2,
      }),
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  }
}

async function callOpenAI(prompt: string, maxTokens = 200): Promise<string | null> {
  if (!OPENAI_KEY) return null
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.2,
      }),
    })
    const json = await res.json()
    return json.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, maxTokens = 300 } = await req.json()

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Groq first, then OpenAI fallback
    let result = await callGroq(prompt, maxTokens)
    if (!result) {
      result = await callOpenAI(prompt, maxTokens)
    }

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal error', result: null }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
