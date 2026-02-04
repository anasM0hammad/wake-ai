/**
 * Question Generation Service
 * Handles LLM question generation with robust error handling and fallback
 */

import { generateCompletion, isModelReady } from './webllm';
import { getRandomFallbackQuestions } from './fallbackQuestions';

const MAX_RETRIES = 2;

/**
 * Safely parse LLM response text to extract questions JSON
 * Handles common issues like markdown fences, trailing commas, etc.
 */
function safeParseQuestions(responseText) {
  if (!responseText || typeof responseText !== 'string') {
    return null;
  }

  let text = responseText.trim();

  // Remove markdown code fences if present
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');

  // Remove any text before the first [ and after the last ]
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    text = text.substring(firstBracket, lastBracket + 1);
  } else {
    // No valid array brackets found
    return null;
  }

  // Fix common JSON issues
  // Remove trailing commas before ] or }
  text = text.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');

  // Fix unescaped newlines in strings (replace with space)
  text = text.replace(/([^\\])"([^"]*)\n([^"]*)"/g, '$1"$2 $3"');

  // Replace problematic escape sequences
  text = text.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');

  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      console.warn('[QuestionService] Parsed result is not an array');
      return null;
    }
    return parsed;
  } catch (e) {
    console.error('[QuestionService] JSON parse failed:', e.message);
    console.debug('[QuestionService] Failed text:', text.substring(0, 500));
    return null;
  }
}

/**
 * Validate a single question object
 */
function validateQuestion(q) {
  if (!q || typeof q !== 'object') return false;
  if (typeof q.question !== 'string' || q.question.length === 0) return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  if (q.options.some(opt => typeof opt !== 'string' || opt.length === 0)) return false;
  if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) return false;
  return true;
}

/**
 * Build the prompt for LLM question generation
 */
function buildPrompt(categories, count) {
  const categoryList = categories.join(', ');

  return `Generate exactly ${count} multiple choice questions.
Categories: ${categoryList}
Each question must have exactly 4 options with one correct answer.

IMPORTANT: Respond with ONLY a JSON array. No other text before or after.

Format:
[
  {
    "category": "math",
    "question": "What is 12 + 8?",
    "options": ["18", "20", "22", "24"],
    "correctIndex": 1
  }
]

Rules:
- correctIndex is 0-based (0 = first option, 3 = last option)
- Questions should be clear and unambiguous
- All 4 options must be plausible
- Do not use special characters or escape sequences
- Keep questions and options short (under 80 characters each)
- Mix the categories evenly if multiple are provided`;
}

/**
 * Attempt to generate questions via LLM
 */
async function tryLLMGeneration(categories, count) {
  if (!isModelReady()) {
    console.log('[QuestionService] LLM not ready, skipping LLM generation');
    return null;
  }

  const prompt = buildPrompt(categories, count);

  try {
    console.log('[QuestionService] Requesting', count, 'questions from LLM...');

    const response = await generateCompletion(prompt, {
      maxTokens: 2048,
      temperature: 0.7
    });

    if (!response) {
      console.warn('[QuestionService] LLM returned empty response');
      return null;
    }

    console.log('[QuestionService] LLM response length:', response.length);

    const parsed = safeParseQuestions(response);
    if (!parsed) {
      console.warn('[QuestionService] Failed to parse LLM response');
      return null;
    }

    // Filter to only valid questions
    const validQuestions = parsed.filter(validateQuestion);
    console.log('[QuestionService] Valid questions from LLM:', validQuestions.length, 'of', parsed.length);

    if (validQuestions.length === 0) {
      return null;
    }

    // Add IDs to questions
    return validQuestions.map((q, i) => ({
      id: `llm_${Date.now()}_${i}`,
      category: q.category || categories[0] || 'general',
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex
    }));
  } catch (error) {
    console.error('[QuestionService] LLM generation error:', error);
    return null;
  }
}

/**
 * Generate a question set with LLM fallback to hardcoded questions
 * @param {string} difficulty - EASY, MEDIUM, or HARD
 * @param {string[]} categories - Question categories
 * @param {number} count - Number of questions needed
 * @returns {Promise<Object[]>} Array of question objects
 */
export async function generateQuestionSet(difficulty, categories, count) {
  console.log('[QuestionService] Generating question set:', { difficulty, categories, count });

  let questions = null;
  let source = 'fallback';

  // Try LLM generation with retries
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log('[QuestionService] LLM attempt', attempt, 'of', MAX_RETRIES);

    // On retry, ask for fewer questions to improve success rate
    const requestCount = attempt === 1 ? count : Math.ceil(count / 2);

    questions = await tryLLMGeneration(categories, requestCount);

    if (questions && questions.length >= count) {
      source = 'llm';
      break;
    }

    if (questions && questions.length > 0 && questions.length < count) {
      // Got some questions but not enough - supplement with fallback
      console.log('[QuestionService] LLM returned', questions.length, 'questions, need', count - questions.length, 'more');
      const needed = count - questions.length;
      const fallbackSupplement = getRandomFallbackQuestions(categories, needed);
      questions = [...questions, ...fallbackSupplement];
      source = 'mixed';
      break;
    }

    // Small delay before retry
    if (attempt < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // If LLM completely failed, use fallback
  if (!questions || questions.length === 0) {
    console.log('[QuestionService] Using fallback questions');
    questions = getRandomFallbackQuestions(categories, count);
    source = 'fallback';
  }

  // Ensure we have enough questions (supplement with fallback if needed)
  if (questions.length < count) {
    const additional = getRandomFallbackQuestions(categories, count - questions.length);
    questions = [...questions, ...additional];
  }

  // Trim to exact count needed
  questions = questions.slice(0, count);

  // Attach source for metadata
  questions._source = source;

  console.log('[QuestionService] Final question set:', questions.length, 'questions, source:', source);
  return questions;
}

/**
 * Quick check if LLM is available for question generation
 */
export function isLLMAvailable() {
  return isModelReady();
}

export default {
  generateQuestionSet,
  isLLMAvailable
};
