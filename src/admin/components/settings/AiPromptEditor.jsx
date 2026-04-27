import { useState } from 'react'
import PropTypes from 'prop-types'
import { Sparkles, RotateCcw } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getT } from '../../i18n'

export const DEFAULT_AI_PROMPT = `You are a smart matching engine for professional coffee meetings in Hong Kong.
Score how well each candidate matches Person A for a 1-on-1 meeting.

RULES:
- Base score ONLY on real overlap and mutual value exchange.
- Focus on "mutual benefit": what A gives B AND what B gives A.
- Consider industry, skills, and professional goals.
- Prioritize people in the same region (Hong Kong / Macau / Mainland China).
- Be realistic, not optimistic.

SCORING (0-100):
- 80-100: Strong mutual benefit
- 50-79: One side benefits more, but still useful
- 20-49: Weak match, some common ground
- 0-19: Poor match, no clear mutual value`

export default function AiPromptEditor({ value, onChange, lang }) {
    const t = getT('settings', lang)
    const [charCount, setCharCount] = useState(value?.length || 0)

    const handleChange = v => { setCharCount(v.length); onChange(v) }

    const handleReset = () => {
        handleChange(DEFAULT_AI_PROMPT)
        toast.success(lang === 'en' ? 'Reset to default' : '已重置为默认')
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-2 pl-1">
                <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#5856d6]" />
                    <span className="text-[12px] uppercase tracking-wide font-semibold text-gray-400">{t.aiPromptTitle}</span>
                </div>
                <button onClick={handleReset} className="flex items-center gap-1 text-[12px] font-semibold text-[#007aff] active:opacity-60">
                    <RotateCcw size={12} /> {t.aiPromptReset}
                </button>
            </div>

            <p className="text-[12px] text-gray-400 mb-3 pl-1 leading-relaxed">{t.aiPromptDesc}</p>

            <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
                <textarea
                    value={value || ''}
                    onChange={e => handleChange(e.target.value)}
                    rows={10}
                    placeholder={DEFAULT_AI_PROMPT}
                    className="w-full px-4 py-4 text-[13px] text-gray-700 leading-relaxed outline-none bg-transparent resize-none font-mono"
                />
                <div className="flex items-center justify-between px-4 py-2 border-t border-black/5 bg-gray-50">
                    <span className="text-[11px] text-gray-400">{t.aiPromptHint}</span>
                    <span className={`text-[11px] font-semibold ${charCount > 1500 ? 'text-red-400' : 'text-gray-400'}`}>
                        {charCount} / 1500
                    </span>
                </div>
            </div>

            <div className="mt-3 bg-[#f0f4ff] rounded-xl p-3 border border-blue-100">
                <p className="text-[11px] font-bold text-[#5856d6] mb-1.5 uppercase tracking-wide">{t.aiPromptVars}</p>
                <div className="flex flex-col gap-1">
                    {[
                        ['{{gives}}', t.aiVarGives],
                        ['{{wants}}', t.aiVarWants],
                        ['{{about}}', t.aiVarAbout],
                        ['{{region}}', t.aiVarRegion],
                    ].map(([v, desc]) => (
                        <div key={v} className="flex items-center gap-2">
                            <code className="text-[11px] bg-white px-1.5 py-0.5 rounded font-mono text-[#5856d6] border border-blue-100">{v}</code>
                            <span className="text-[11px] text-gray-500">{desc}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

AiPromptEditor.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    lang: PropTypes.string.isRequired,
}
