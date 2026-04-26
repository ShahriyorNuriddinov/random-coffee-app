/**
 * AI Utilities — Groq (primary) + OpenAI (fallback)
 */

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY
const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY

// ─── Groq API call ────────────────────────────────────────────────────────────
async function callGroq(prompt, maxTokens = 300) {
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
        if (!res.ok) {
            return null
        }
        const json = await res.json()
        return json.choices?.[0]?.message?.content?.trim() || null
    } catch (e) {
        return null
    }
}

// ─── OpenAI API call (fallback) ───────────────────────────────────────────────
async function callOpenAI(prompt, maxTokens = 200) {
    if (!OPENAI_KEY || OPENAI_KEY === 'sk-your-openai-key-here') return null
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
    } catch (e) {
        return null
    }
}

async function callAI(prompt, maxTokens = 300) {
    const groqResult = await callGroq(prompt, maxTokens)
    if (groqResult) return groqResult
    return await callOpenAI(prompt, maxTokens)
}

// ─── Tag extraction ───────────────────────────────────────────────────────────
export async function extractTags(about = '', gives = '', wants = '') {
    const prompt = `Extract keywords from this networking profile for smart matching.
Return ONLY a JSON object, no explanation:
{
  "gives_keywords": ["3-6 phrases: what this person can OFFER"],
  "wants_keywords": ["3-6 phrases: what this person WANTS to get"],
  "interests": ["3-5 general interests/industry keywords"]
}

About: ${about}
Gives: ${gives}
Wants: ${wants}`

    const result = await callAI(prompt, 250)
    if (!result) return extractTagsFallback(about, gives, wants)

    try {
        const match = result.match(/\{[\s\S]*\}/s)
        if (!match) return extractTagsFallback(about, gives, wants)
        const parsed = JSON.parse(match[0])
        return [
            ...(parsed.gives_keywords || []),
            ...(parsed.wants_keywords || []),
            ...(parsed.interests || []),
        ]
    } catch {
        return extractTagsFallback(about, gives, wants)
    }
}

// ─── Translation ──────────────────────────────────────────────────────────────
export async function translateText(text, targetLang = 'zh') {
    const instruction = targetLang === 'zh'
        ? 'Translate the following text to Simplified Chinese. Return ONLY the translation, no explanation, no prefix.'
        : 'Translate the following text to English. Return ONLY the translation, no explanation, no prefix.'
    const prompt = `${instruction}\n\n${text}`
    const result = await callAI(prompt, 300)
    if (!result) return null
    // Strip common AI prefixes like "Translation:", "翻译:", etc.
    return result
        .replace(/^(Translation|Translate|翻译|译文)\s*:\s*/i, '')
        .replace(/^["']|["']$/g, '')
        .trim()
}

// Translate multiple fields in ONE request to avoid rate limits
export async function translateProfile(profile, targetLang = 'zh') {
    const { about, gives, wants } = profile
    if (!about && !gives && !wants) return null

    const instruction = targetLang === 'zh'
        ? 'Translate each section to Simplified Chinese. Return ONLY a JSON object.'
        : 'Translate each section to English. Return ONLY a JSON object.'

    const prompt = `${instruction}

Input:
{"about": ${JSON.stringify(about || '')}, "gives": ${JSON.stringify(gives || '')}, "wants": ${JSON.stringify(wants || '')}}

Return ONLY valid JSON with same keys, translated values.`

    const result = await callAI(prompt, 400)
    if (!result) return null

    try {
        const match = result.match(/\{[\s\S]*\}/)
        if (!match) return null
        const parsed = JSON.parse(match[0])
        // Validate: translated text should differ from original
        if (parsed.about === about && parsed.gives === gives) return null
        return {
            about: parsed.about || null,
            gives: parsed.gives || null,
            wants: parsed.wants || null,
        }
    } catch {
        return null
    }
}

// ─── Fallback keyword extraction ──────────────────────────────────────────────
function extractTagsFallback(about, gives, wants) {
    const text = `${about} ${gives} ${wants}`.toLowerCase()
    const keywords = [
        'entrepreneur', 'startup', 'investor', 'developer', 'designer',
        'marketing', 'finance', 'tech', 'ai', 'blockchain', 'product',
        'sales', 'consulting', 'education', 'healthcare', 'media',
        'react', 'python', 'javascript', 'mobile', 'web', 'data',
        'mentor', 'coach', 'founder', 'cto', 'ceo', 'manager',
        'business', 'growth', 'strategy', 'leadership',
    ]
    return keywords.filter(kw => text.includes(kw))
        .slice(0, 8)
        .map(t => t.charAt(0).toUpperCase() + t.slice(1))
}

// ─── BATCH AI Match Scoring — ONE call for ALL candidates ────────────────────
/**
 * Score all candidates against myProfile in a SINGLE AI request.
 * Avoids rate limits by batching everything into one prompt.
 *
 * @param {object} myProfile - { gives, wants, about }
 * @param {object[]} candidates - array of { gives, wants, about }
 * @param {string} customPrompt - user's custom search request (boost)
 * @param {string} systemPrompt - admin-configured AI prompt from app_settings
 * @returns {number[]} - scores array in same order as candidates
 */
export async function calcMatchScoresBatch(myProfile = {}, candidates = [], customPrompt = '', systemPrompt = '') {
    if (!candidates.length) return []

    const { gives: myGives = '', wants: myWants = '', about: myAbout = '' } = myProfile

    // If my profile is empty — use keyword fallback for all
    if (!myGives && !myWants && !customPrompt) {
        return candidates.map(p => calcMatchScore(myProfile, p))
    }

    const candidateList = candidates.map((p, i) =>
        `${i + 1}. About: "${(p.about || 'n/a').slice(0, 100)}" | Offers: "${(p.gives || 'n/a').slice(0, 120)}" | Needs: "${(p.wants || 'n/a').slice(0, 120)}"`
    ).join('\n')

    // Use admin-configured system prompt if available, otherwise use default
    const basePrompt = systemPrompt?.trim()
        ? systemPrompt.trim()
        : `SYSTEM: You are a smart matching engine for professional coffee meetings.
Your task is to score how well each candidate matches Person A for a 1-on-1 meeting.

RULES:
- Do NOT give random scores. Base score ONLY on real overlap and mutual value exchange.
- If there is low synergy, do not force a high score.
- Focus on "mutual benefit": what A gives B AND what B gives A.
- Be realistic, not optimistic.

SCORING (0-100):
- 80-100: Strong mutual benefit — A gives what B needs AND B gives what A needs
- 50-79: One side benefits more, but still a useful meeting
- 20-49: Weak match, some common ground
- 0-19: Poor match, no clear mutual value`

    const prompt = `${basePrompt}${customPrompt ? `\n\nSpecial request from Person A: "${customPrompt.slice(0, 200)}" — heavily prioritize this.` : ''}

Person A:
- About: ${(myAbout || 'n/a').slice(0, 150)}
- Can Offer: ${(myGives || 'n/a').slice(0, 150)}
- Looking For: ${(myWants || 'n/a').slice(0, 150)}

Candidates:
${candidateList}

Return ONLY a JSON array of integers in the same order as candidates.
Example for 4 candidates: [85, 42, 17, 63]`

    const maxTokens = Math.min(50 + candidates.length * 5, 200)
    const result = await callAI(prompt, maxTokens)

    if (!result) {
        return candidates.map(p => calcMatchScore(myProfile, p))
    }

    try {
        const match = result.match(/\[[\d,\s]+\]/)
        if (!match) {
            return candidates.map(p => calcMatchScore(myProfile, p))
        }
        const scores = JSON.parse(match[0])
        return candidates.map((_, i) =>
            Math.min(100, Math.max(0, Math.round(Number(scores[i]) || 0)))
        )
    } catch (e) {
        return candidates.map(p => calcMatchScore(myProfile, p))
    }
}

// ─── Sync keyword-based match score (fallback) ────────────────────────────────
export function calcMatchScore(myProfile = {}, theirProfile = {}) {
    if (Array.isArray(myProfile) && Array.isArray(theirProfile)) {
        return _tagSimilarity(myProfile, theirProfile)
    }

    const myGives = _tokenize(myProfile.gives || '')
    const myWants = _tokenize(myProfile.wants || '')
    const theirGives = _tokenize(theirProfile.gives || '')
    const theirWants = _tokenize(theirProfile.wants || '')

    const aGivesBWants = _overlap(myGives, theirWants)
    const bGivesAWants = _overlap(theirGives, myWants)
    const mutualValue = aGivesBWants > 0 && bGivesAWants > 0
        ? (aGivesBWants + bGivesAWants) / 2
        : Math.max(aGivesBWants, bGivesAWants) * 0.4
    const crossScore = Math.round(mutualValue * 60)
    const interestScore = Math.round(_tagSimilarity(myProfile.tags || [], theirProfile.tags || []) * 0.4)

    return Math.min(100, crossScore + interestScore)
}

// ─── AI Match Explanation ────────────────────────────────────────────────────
/**
 * Generate a short explanation of why two people are a good match.
 * @param {object} myProfile
 * @param {object} theirProfile
 * @param {string} lang - 'en' | 'zh'
 */
export async function explainMatch(myProfile = {}, theirProfile = {}, lang = 'en') {
    const langInstruction = lang === 'zh'
        ? 'IMPORTANT: Write the entire response in Simplified Chinese only. Do not use any English.'
        : 'Write the response in English.'

    const prompt = `SYSTEM: You are a smart matching engine for professional coffee meetings.
Analyze these two people and explain why their meeting would be valuable.
${langInstruction}

Person A:
- About: ${(myProfile.about || 'n/a').slice(0, 150)}
- Can Offer: ${(myProfile.gives || 'n/a').slice(0, 150)}
- Looking For: ${(myProfile.wants || 'n/a').slice(0, 150)}

Person B:
- About: ${(theirProfile.about || 'n/a').slice(0, 150)}
- Can Offer: ${(theirProfile.gives || 'n/a').slice(0, 150)}
- Looking For: ${(theirProfile.wants || 'n/a').slice(0, 150)}

Write 1-2 sentences explaining the mutual value exchange. Be specific and realistic.
Focus on: what A gives B AND what B gives A.
Return ONLY the explanation, no labels or formatting.`

    return await callAI(prompt, 180)
}

// ─── Meeting Conversation Starters ───────────────────────────────────────────
/**
 * Generate 3-4 conversation starter questions for a meeting.
 * @param {object} myProfile
 * @param {object} theirProfile
 * @param {string} lang - 'en' | 'zh'
 */
export async function generateMeetingQuestions(myProfile = {}, theirProfile = {}, lang = 'en') {
    const langInstruction = lang === 'zh'
        ? 'IMPORTANT: You MUST write all questions in Simplified Chinese only. Do not use any English.'
        : 'Write all questions in English.'

    const prompt = `Generate 3 specific conversation starter questions for a coffee meeting between these two people. Questions should help them exchange value and get to know each other professionally. ${langInstruction}

Person A: ${myProfile.about || ''} | Offers: ${myProfile.gives || ''} | Needs: ${myProfile.wants || ''}
Person B: ${theirProfile.about || ''} | Offers: ${theirProfile.gives || ''} | Needs: ${theirProfile.wants || ''}

Return ONLY a JSON array of 3 question strings.
Example for Chinese: ["你在X方面最大的挑战是什么？", "你是如何进入Y领域的？", "你现在在做什么项目？"]`

    const result = await callAI(prompt, 200)
    if (!result) return []
    try {
        const match = result.match(/\[[\s\S]*?\]/)
        if (!match) return []
        return JSON.parse(match[0])
    } catch {
        return []
    }
}

// ─── Profile Strength Score ───────────────────────────────────────────────────
/**
 * Score profile completeness and quality (0-100) with improvement tips.
 * Returns { score, tips[] }
 */
export async function scoreProfile(about = '', gives = '', wants = '') {
    if (!about && !gives && !wants) return { score: 0, tips: ['Fill in your profile to get matched'] }

    const prompt = `Evaluate this networking profile for quality and completeness. Score 0-100 and give 1-3 specific improvement tips.

About: ${about}
Can offer: ${gives}
Looking for: ${wants}

SCORING:
- 80-100: Specific, detailed, clear value proposition
- 50-79: Good but could be more specific
- 20-49: Too vague or incomplete
- 0-19: Almost empty

Return ONLY JSON: {"score": <number>, "tips": ["tip1", "tip2"]}
Tips should be short and actionable (max 10 words each).`

    const result = await callAI(prompt, 200)
    if (!result) return { score: 50, tips: [] }
    try {
        const match = result.match(/\{[\s\S]*?\}/)
        if (!match) return { score: 50, tips: [] }
        return JSON.parse(match[0])
    } catch {
        return { score: 50, tips: [] }
    }
}

// ─── Grammar & Style Check ────────────────────────────────────────────────────
/**
 * Check and improve profile text grammar/style.
 * Returns improved text or null if no changes needed.
 */
export async function improveProfileText(text = '', fieldName = '') {
    if (!text || text.length < 10) return null

    const prompt = `Fix grammar, spelling and improve clarity of this networking profile "${fieldName}" field. Keep the same meaning and language (English or Chinese). If text is already good, return it unchanged.

Text: ${text}

Return ONLY the improved text, nothing else.`

    const result = await callAI(prompt, 200)
    if (!result || result.trim() === text.trim()) return null
    return result.trim()
}
function _tokenize(text = '') {
    return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 3)
}

function _overlap(setA = [], setB = []) {
    if (!setA.length || !setB.length) return 0
    const a = new Set(setA)
    const b = new Set(setB)
    let common = 0
    for (const w of a) {
        if (b.has(w)) common++
        else for (const bw of b) { if (bw.includes(w) || w.includes(bw)) { common += 0.5; break } }
    }
    return Math.min(1, common / Math.max(a.size, b.size, 1))
}

function _tagSimilarity(tagsA = [], tagsB = []) {
    if (!tagsA.length || !tagsB.length) return 0
    const a = new Set(tagsA.map(t => t.toLowerCase()))
    const b = new Set(tagsB.map(t => t.toLowerCase()))
    let common = 0
    for (const tag of a) { if (b.has(tag)) common++ }
    return Math.round((common / new Set([...a, ...b]).size) * 100)
}
