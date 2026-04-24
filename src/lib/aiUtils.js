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
            console.error('[Groq] HTTP', res.status)
            return null
        }
        const json = await res.json()
        return json.choices?.[0]?.message?.content?.trim() || null
    } catch (e) {
        console.error('[Groq]', e)
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
        console.error('[OpenAI]', e)
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
export async function translateText(text) {
    const prompt = `Translate to English (if already English, translate to Chinese). Return ONLY the translation:\n\n${text}`
    return await callAI(prompt, 200)
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
 * @returns {number[]} - scores array in same order as candidates
 */
export async function calcMatchScoresBatch(myProfile = {}, candidates = []) {
    if (!candidates.length) return []

    const { gives: myGives = '', wants: myWants = '', about: myAbout = '' } = myProfile

    // If my profile is empty — use keyword fallback for all
    if (!myGives && !myWants) {
        return candidates.map(p => calcMatchScore(myProfile, p))
    }

    const candidateList = candidates.map((p, i) =>
        `${i + 1}. About: "${(p.about || 'n/a').slice(0, 80)}" | Offers: "${(p.gives || 'n/a').slice(0, 100)}" | Needs: "${(p.wants || 'n/a').slice(0, 100)}" | Region: ${p.region || 'n/a'}`
    ).join('\n')

    const prompt = `You are a professional networking matchmaker for Random Coffee app.
Score how well each candidate matches Person A for a 1-on-1 coffee meeting.

Person A:
- About: ${(myAbout || 'n/a').slice(0, 150)}
- Can offer: ${(myGives || 'n/a').slice(0, 150)}
- Looking for: ${(myWants || 'n/a').slice(0, 150)}

Candidates:
${candidateList}

SCORING (0-100):
- 80-100: Both sides clearly benefit (A gives what they need AND they give what A needs)
- 50-79: One side benefits more, but still useful meeting
- 20-49: Weak match, some common ground
- 0-19: Poor match, no clear mutual value

Return ONLY a JSON array of integers in the same order as candidates.
Example for 4 candidates: [85, 42, 17, 63]`

    const maxTokens = Math.min(50 + candidates.length * 5, 200)
    const result = await callAI(prompt, maxTokens)

    if (!result) {
        console.warn('[AI Batch] No result, using keyword fallback')
        return candidates.map(p => calcMatchScore(myProfile, p))
    }

    try {
        const match = result.match(/\[[\d,\s]+\]/)
        if (!match) {
            console.warn('[AI Batch] Could not parse scores:', result)
            return candidates.map(p => calcMatchScore(myProfile, p))
        }
        const scores = JSON.parse(match[0])
        return candidates.map((_, i) =>
            Math.min(100, Math.max(0, Math.round(Number(scores[i]) || 0)))
        )
    } catch (e) {
        console.error('[AI Batch] Parse error:', e)
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
        ? 'IMPORTANT: You MUST write the entire explanation in Simplified Chinese only. Do not use any English.'
        : 'Write the explanation in English.'

    const prompt = `You are a networking matchmaker. In 1-2 sentences, explain why these two people would have a valuable coffee meeting. Be specific and focus on mutual value exchange. ${langInstruction}

Person A offers: ${myProfile.gives || 'n/a'}
Person A needs: ${myProfile.wants || 'n/a'}

Person B offers: ${theirProfile.gives || 'n/a'}
Person B needs: ${theirProfile.wants || 'n/a'}

Return ONLY the explanation sentence(s), no labels or formatting.`

    return await callAI(prompt, 150)
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
