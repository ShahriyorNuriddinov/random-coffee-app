/**
 * AI Utilities — Groq ONLY (fast, free, no limits)
 */

// ⚠️ SECURITY WARNING: API keys should NEVER be in client-side code!
// These keys are exposed in the browser and can be stolen.
// TODO: Move all AI calls to Supabase Edge Functions
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY

// Temporary client-side usage - MUST migrate to Edge Functions before production!

// ─── Groq API call ────────────────────────────────────────────────────────────
async function callGroq(prompt, maxTokens = 500) {
    if (!GROQ_KEY) {
        console.error('[Groq] API key not found')
        return null
    }

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
                temperature: 0.3,
            }),
        })

        if (!res.ok) {
            const errorText = await res.text()
            console.error('[Groq] API error:', res.status, res.statusText, errorText)
            return null
        }

        const json = await res.json()
        const content = json.choices?.[0]?.message?.content?.trim()

        if (!content) {
            console.error('[Groq] Empty response')
            return null
        }

        return content
    } catch (e) {
        console.error('[Groq] Network error:', e)
        return null
    }
}

// Main AI function - uses Groq only
async function callAI(prompt, maxTokens = 500) {
    return await callGroq(prompt, maxTokens)
}

// ─── Tag extraction ───────────────────────────────────────────────────────────
export async function extractTags(about = '', gives = '', wants = '') {
    const prompt = `Extract keywords from this networking profile for smart matching.
Return ONLY a valid JSON object with no markdown, no explanation, no code blocks:
{
  "gives_keywords": ["3-6 phrases: what this person can OFFER"],
  "wants_keywords": ["3-6 phrases: what this person WANTS to get"],
  "interests": ["3-5 general interests/industry keywords"]
}

About: ${about}
Gives: ${gives}
Wants: ${wants}

IMPORTANT: Return ONLY the JSON object, nothing else.`

    const result = await callAI(prompt, 300)
    if (!result) {
        console.warn('[extractTags] No result from AI, using fallback')
        return extractTagsFallback(about, gives, wants)
    }

    try {
        // Remove markdown code blocks if present
        let cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

        // Extract JSON object
        const match = cleaned.match(/\{[\s\S]*\}/s)
        if (!match) {
            console.warn('[extractTags] No JSON found in response:', result)
            return extractTagsFallback(about, gives, wants)
        }

        const parsed = JSON.parse(match[0])
        const tags = [
            ...(Array.isArray(parsed.gives_keywords) ? parsed.gives_keywords : []),
            ...(Array.isArray(parsed.wants_keywords) ? parsed.wants_keywords : []),
            ...(Array.isArray(parsed.interests) ? parsed.interests : []),
        ]

        return tags.length > 0 ? tags : extractTagsFallback(about, gives, wants)
    } catch (e) {
        console.error('[extractTags] Parse error:', e, 'Response:', result)
        return extractTagsFallback(about, gives, wants)
    }
}

// ─── Translation ──────────────────────────────────────────────────────────────
export async function translateText(text, targetLang = 'zh') {
    if (!text || text.trim().length === 0) return null

    const instructions = {
        zh: 'Translate the following text to Simplified Chinese. Return ONLY the translated text, no explanation, no labels, no quotes.',
        en: 'Translate the following text to English. Return ONLY the translated text, no explanation, no labels, no quotes.',
        ru: 'Translate the following text to Russian. Return ONLY the translated text, no explanation, no labels, no quotes.',
    }

    const instruction = instructions[targetLang] || instructions.en
    const prompt = `${instruction}\n\nText to translate:\n${text}`

    const result = await callAI(prompt, 400)
    if (!result) {
        console.warn('[translateText] No result from AI')
        return null
    }

    // Clean up common prefixes and quotes
    let cleaned = result
        .replace(/^(Translation|Translate|翻译|译文|Перевод|Translated text|Here is the translation)\s*:\s*/i, '')
        .replace(/^["'`]|["'`]$/g, '')
        .trim()

    return cleaned.length > 0 ? cleaned : null
}

// Translate multiple fields in ONE request
export async function translateProfile(profile, targetLang = 'zh') {
    const { about, gives, wants } = profile
    if (!about && !gives && !wants) return null

    const instructions = {
        zh: 'Translate each field to Simplified Chinese.',
        en: 'Translate each field to English.',
        ru: 'Translate each field to Russian.',
    }
    const instruction = instructions[targetLang] || instructions.en

    const prompt = `${instruction}

Input JSON:
{"about": ${JSON.stringify(about || '')}, "gives": ${JSON.stringify(gives || '')}, "wants": ${JSON.stringify(wants || '')}}

Return ONLY a valid JSON object with the same keys but translated values. No markdown, no code blocks, no explanation.`

    const result = await callAI(prompt, 500)
    if (!result) {
        console.warn('[translateProfile] No result from AI')
        return null
    }

    try {
        // Remove markdown code blocks if present
        let cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

        const match = cleaned.match(/\{[\s\S]*\}/)
        if (!match) {
            console.warn('[translateProfile] No JSON found in response:', result)
            return null
        }

        const parsed = JSON.parse(match[0])

        // Validate: translated text should differ from original
        if (parsed.about === about && parsed.gives === gives && parsed.wants === wants) {
            console.warn('[translateProfile] Translation same as original')
            return null
        }

        return {
            about: parsed.about || null,
            gives: parsed.gives || null,
            wants: parsed.wants || null,
        }
    } catch (e) {
        console.error('[translateProfile] Parse error:', e, 'Response:', result)
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
        console.warn('[calcMatchScoresBatch] Empty profile, using fallback')
        return candidates.map(p => calcMatchScore(myProfile, p))
    }

    const candidateList = candidates.slice(0, 20).map((p, i) =>
        `${i + 1}. About: "${(p.about || 'n/a').slice(0, 100)}" | Offers: "${(p.gives || 'n/a').slice(0, 100)}" | Needs: "${(p.wants || 'n/a').slice(0, 100)}"`
    ).join('\n')

    // Use admin-configured system prompt if available, otherwise use default
    const basePrompt = systemPrompt?.trim()
        ? systemPrompt.trim()
        : `You are a smart matching engine for professional coffee meetings.
Score how well each candidate matches Person A for a 1-on-1 meeting.

RULES:
- Base scores on real overlap and mutual value exchange
- Focus on mutual benefit: what A gives B AND what B gives A
- Be realistic, not optimistic

SCORING (0-100):
- 80-100: Strong mutual benefit
- 50-79: One side benefits more
- 20-49: Weak match
- 0-19: Poor match`

    const prompt = `${basePrompt}${customPrompt ? `\n\nSpecial request: "${customPrompt.slice(0, 200)}"` : ''}

Person A:
- About: ${(myAbout || 'n/a').slice(0, 150)}
- Offers: ${(myGives || 'n/a').slice(0, 150)}
- Needs: ${(myWants || 'n/a').slice(0, 150)}

Candidates:
${candidateList}

Return ONLY a JSON array of integers (0-100) in the same order.
Example: [85, 42, 17, 63]
No explanation, no markdown, just the array.`

    const maxTokens = Math.min(100 + candidates.length * 3, 300)
    const result = await callAI(prompt, maxTokens)

    if (!result) {
        console.warn('[calcMatchScoresBatch] No result from AI, using fallback')
        return candidates.map(p => calcMatchScore(myProfile, p))
    }

    try {
        // Remove markdown if present
        let cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

        const match = cleaned.match(/\[[\d,\s]+\]/)
        if (!match) {
            console.warn('[calcMatchScoresBatch] No array found in response:', result)
            return candidates.map(p => calcMatchScore(myProfile, p))
        }

        const scores = JSON.parse(match[0])

        if (!Array.isArray(scores) || scores.length === 0) {
            console.warn('[calcMatchScoresBatch] Invalid scores array')
            return candidates.map(p => calcMatchScore(myProfile, p))
        }

        return candidates.map((_, i) =>
            Math.min(100, Math.max(0, Math.round(Number(scores[i]) || 0)))
        )
    } catch (e) {
        console.error('[calcMatchScoresBatch] Parse error:', e, 'Response:', result)
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
 * @param {string} lang - 'en' | 'zh' | 'ru'
 */
export async function explainMatch(myProfile = {}, theirProfile = {}, lang = 'en') {
    const langInstruction = lang === 'zh'
        ? 'Write the entire response in Simplified Chinese only.'
        : lang === 'ru'
            ? 'Write the entire response in Russian only.'
            : 'Write the response in English.'

    const prompt = `You are a smart matching engine for professional coffee meetings.
Explain why these two people would have a valuable meeting.
${langInstruction}

Person A:
- About: ${(myProfile.about || 'n/a').slice(0, 150)}
- Offers: ${(myProfile.gives || 'n/a').slice(0, 150)}
- Needs: ${(myProfile.wants || 'n/a').slice(0, 150)}

Person B:
- About: ${(theirProfile.about || 'n/a').slice(0, 150)}
- Offers: ${(theirProfile.gives || 'n/a').slice(0, 150)}
- Needs: ${(theirProfile.wants || 'n/a').slice(0, 150)}

Write 1-2 sentences explaining the mutual value. Be specific.
Return ONLY the explanation text, no labels.`

    const result = await callAI(prompt, 200)
    return result || null
}

// ─── Meeting Conversation Starters ───────────────────────────────────────────
/**
 * Generate 3 conversation starter questions for a meeting.
 * @param {object} myProfile
 * @param {object} theirProfile
 * @param {string} lang - 'en' | 'zh' | 'ru'
 */
export async function generateMeetingQuestions(myProfile = {}, theirProfile = {}, lang = 'en') {
    const langInstruction = lang === 'zh'
        ? 'Write all questions in Simplified Chinese only.'
        : lang === 'ru'
            ? 'Write all questions in Russian only.'
            : 'Write all questions in English.'

    const prompt = `Generate 3 conversation starter questions for a coffee meeting.
${langInstruction}

Person A: ${(myProfile.about || '').slice(0, 100)} | Offers: ${(myProfile.gives || '').slice(0, 100)} | Needs: ${(myProfile.wants || '').slice(0, 100)}
Person B: ${(theirProfile.about || '').slice(0, 100)} | Offers: ${(theirProfile.gives || '').slice(0, 100)} | Needs: ${(theirProfile.wants || '').slice(0, 100)}

Return ONLY a JSON array of 3 question strings. No markdown, no explanation.
Example: ["Question 1?", "Question 2?", "Question 3?"]`

    const result = await callAI(prompt, 250)
    if (!result) return []

    try {
        // Remove markdown if present
        let cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

        const match = cleaned.match(/\[[\s\S]*?\]/)
        if (!match) return []

        const questions = JSON.parse(match[0])
        return Array.isArray(questions) ? questions.slice(0, 3) : []
    } catch (e) {
        console.error('[generateMeetingQuestions] Parse error:', e)
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
