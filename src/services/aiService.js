/**
 * AI Study Routine Generator Service.
 * Uses OpenAI API if key is available, otherwise falls back to demo mode.
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

/**
 * Generate a 5-day study routine based on upcoming exams.
 * @param {Array} upcomingExams - Array of { title, date, type } college events
 * @returns {Array} Array of study block objects ready for studentEvents
 */
export async function generateStudyRoutine(upcomingExams) {
  if (OPENAI_API_KEY && OPENAI_API_KEY !== 'demo') {
    return await generateWithOpenAI(upcomingExams)
  }
  return generateDemoRoutine(upcomingExams)
}

/**
 * Calls OpenAI Chat Completions API.
 */
async function generateWithOpenAI(exams) {
  const examList = exams
    .map((e) => `- ${e.title} on ${e.date} (${e.type})`)
    .join('\n')

  const prompt = `You are an academic study planner AI. Given the following upcoming college exams and assignments, generate a 5-day study plan starting from tomorrow.

UPCOMING EXAMS/ASSIGNMENTS:
${examList}

RULES:
1. Create 2-3 study blocks per day, each 1-2 hours long
2. Space them between 8:00 AM and 8:00 PM
3. Prioritize subjects with closer exam dates
4. Include short review sessions and intensive deep-study blocks
5. Add variety — mix subjects across days

Return ONLY a JSON array (no markdown, no explanation) with objects having these exact fields:
- "title": string (e.g., "Deep Study: Data Science - Chapter 5")
- "date": string in YYYY-MM-DD format
- "startTime": string in HH:MM format (24h)
- "endTime": string in HH:MM format (24h)
- "description": string (brief study goal for this block)`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message || `OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    // Parse the JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('AI response did not contain valid JSON array')
    }

    const blocks = JSON.parse(jsonMatch[0])
    return blocks.map((b) => ({
      title: b.title,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      description: b.description || '',
      isAiGenerated: true,
    }))
  } catch (err) {
    console.error('OpenAI API failed, falling back to demo:', err)
    return generateDemoRoutine(exams)
  }
}

/**
 * Generates a realistic demo study routine without calling an API.
 * Used when no API key is configured or as a fallback.
 */
function generateDemoRoutine(exams) {
  const blocks = []
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Sort exams by date (closest first)
  const sortedExams = [...exams].sort((a, b) => {
    const dA = new Date(a.date)
    const dB = new Date(b.date)
    return dA - dB
  })

  // If no exams provided, create generic study blocks
  const subjects =
    sortedExams.length > 0
      ? sortedExams.map((e) => e.title.replace(/\b(exam|test|quiz|midterm|final)\b/gi, '').trim())
      : ['Data Science', 'Statistics', 'DSA', 'Machine Learning']

  const studyTemplates = [
    { prefix: 'Review:', suffix: '- Key Concepts', desc: 'Review fundamental concepts and definitions' },
    { prefix: 'Deep Study:', suffix: '- Problem Solving', desc: 'Work through practice problems and exercises' },
    { prefix: 'Practice:', suffix: '- Past Papers', desc: 'Solve past exam papers and sample questions' },
    { prefix: 'Revision:', suffix: '- Notes Summary', desc: 'Create concise revision notes and flashcards' },
    { prefix: 'Mock Test:', suffix: '- Self Assessment', desc: 'Take a timed practice test to assess readiness' },
  ]

  const timeSlots = [
    { start: '08:00', end: '09:30' },
    { start: '10:00', end: '11:30' },
    { start: '14:00', end: '15:30' },
    { start: '16:00', end: '17:30' },
    { start: '19:00', end: '20:00' },
  ]

  for (let day = 0; day < 5; day++) {
    const date = new Date(tomorrow)
    date.setDate(date.getDate() + day)
    const dateStr = date.toISOString().split('T')[0]

    // 2-3 blocks per day
    const blocksPerDay = day < 3 ? 3 : 2
    const template = studyTemplates[day % studyTemplates.length]

    for (let b = 0; b < blocksPerDay; b++) {
      const subjectIndex = (day + b) % subjects.length
      const subject = subjects[subjectIndex]
      const slot = timeSlots[(day + b) % timeSlots.length]

      blocks.push({
        title: `${template.prefix} ${subject} ${template.suffix}`,
        date: dateStr,
        startTime: slot.start,
        endTime: slot.end,
        description: `${template.desc} for ${subject}`,
        isAiGenerated: true,
      })
    }
  }

  return blocks
}
