import { InvokeLLM } from '@/integrations/Core';

/**
 * Generate contextual AI explanations for each wrong quiz answer.
 * Returns an object keyed by question index (string) → explanation string.
 * Correct answers are omitted from the result.
 */
export async function generateQuizExplanations(moduleTitle, quiz, quizAnswers) {
  const wrongItems = quiz
    .map((q, i) => ({ ...q, idx: i, userAnswerIndex: quizAnswers[i] }))
    .filter(q => quizAnswers[q.idx] !== q.correct);

  if (!wrongItems.length) return {};

  const questionList = wrongItems.map(q =>
    `Index ${q.idx}: "${q.question}"\n  User chose: "${q.options[q.userAnswerIndex] ?? 'no answer'}"\n  Correct: "${q.options[q.correct]}"`
  ).join('\n\n');

  const prompt = `You are a cybersecurity training coach for the "${moduleTitle}" module.

For each wrong answer below, write a concise 1-2 sentence explanation (max 50 words each) explaining WHY the correct answer is right and what concept the learner should revisit. Be direct and educational.

${questionList}

Respond ONLY with valid JSON — an object where keys are the index numbers (as strings) and values are explanation strings. No markdown, no code fences, just raw JSON.
Example: {"2": "The correct answer is X because...", "4": "Y is correct because..."}`;

  try {
    const raw = await InvokeLLM({ prompt, feature: 'quiz_explain' });
    const cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleaned);
  } catch {
    return {};
  }
}

/**
 * Generate a fresh set of adaptive quiz questions targeting weak areas.
 * Returns an array of { question, options, correct } objects (same shape as hardcoded quiz).
 * Falls back to empty array on any error.
 */
export async function generateAdaptiveQuestions(moduleTitle, weakQuestions, count = 5) {
  const topics = weakQuestions.slice(0, 6).join('\n- ');

  const prompt = `You are building adaptive quiz questions for the "${moduleTitle}" cybersecurity training module.

The learner struggled with these topics:
- ${topics}

Generate ${count} NEW multiple-choice questions that test understanding of these specific weak areas. Make questions slightly different in framing from typical textbook questions — use realistic workplace scenarios where possible.

Rules:
- Each question must have exactly 4 options (A, B, C, D)
- Only one option is correct
- correct field is the 0-based index of the correct option (0=A, 1=B, 2=C, 3=D)
- Questions must be at the same difficulty as the original module (not trick questions)

Respond ONLY with a valid JSON array. No markdown, no code fences.
Example format:
[{"question":"...","options":["A","B","C","D"],"correct":2}]`;

  try {
    const raw = await InvokeLLM({ prompt, feature: 'quiz_adaptive' });
    const cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed) || !parsed.length) return [];
    return parsed.filter(q =>
      q.question && Array.isArray(q.options) && q.options.length === 4 && typeof q.correct === 'number'
    );
  } catch {
    return [];
  }
}

/**
 * Ask the AI training coach a question within a module context.
 * Returns the coach's response as a markdown string.
 */
export async function askTrainingCoach(moduleTitle, currentSectionTitle, history, userQuestion) {
  const historyText = history.slice(-6).map(m =>
    `${m.role === 'user' ? 'Learner' : 'Coach'}: ${m.content}`
  ).join('\n');

  const prompt = `You are a friendly, expert cybersecurity training coach for Hubcys. The learner is currently studying the "${moduleTitle}" module, specifically the section "${currentSectionTitle}".

${history.length ? `Recent conversation:\n${historyText}\n` : ''}
Learner asks: "${userQuestion}"

Give a clear, concise answer (2-4 sentences max) that directly helps the learner understand the concept. Use simple language. If relevant, relate the answer to real-world workplace scenarios. Do not use markdown — plain text only.`;

  return InvokeLLM({ prompt, feature: 'training_coach' });
}
