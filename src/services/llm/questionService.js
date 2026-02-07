/**
 * Question Generation Service
 * Single question generation with LLM verification
 */

import { generateCompletion, isModelReady } from './webllm';
import { getRandomFallbackQuestions } from './fallbackQuestions';

const MAX_VERIFICATION_ATTEMPTS = 2;

/**
 * Parse a single question JSON from LLM response
 */
function parseSingleQuestion(responseText) {
  if (!responseText || typeof responseText !== 'string') {
    return null;
  }

  let text = responseText.trim();

  // Remove markdown code fences
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');

  // Find JSON object
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  text = text.substring(firstBrace, lastBrace + 1);

  // Fix trailing commas
  text = text.replace(/,\s*}/g, '}');

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('[QuestionService] JSON parse failed:', e.message);
    return null;
  }
}

/**
 * Validate question structure
 */
function isValidQuestion(q) {
  if (!q || typeof q !== 'object') return false;
  if (typeof q.question !== 'string' || q.question.length === 0) return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  if (q.options.some(opt => typeof opt !== 'string' || opt.length === 0)) return false;
  if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) return false;
  return true;
}

/**
 * Normalize answer for comparison (lowercase, trim, remove punctuation)
 */
function normalizeAnswer(answer) {
  if (!answer) return '';
  return String(answer)
    .toLowerCase()
    .trim()
    .replace(/[.,!?]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Find if LLM's answer matches any option
 * Returns the matching index or -1
 */
function findAnswerInOptions(llmAnswer, options) {
  const normalizedLLMAnswer = normalizeAnswer(llmAnswer);

  for (let i = 0; i < options.length; i++) {
    const normalizedOption = normalizeAnswer(options[i]);
    // Check if LLM answer matches or contains the option (or vice versa)
    if (normalizedLLMAnswer === normalizedOption ||
        normalizedLLMAnswer.includes(normalizedOption) ||
        normalizedOption.includes(normalizedLLMAnswer)) {
      return i;
    }
  }
  return -1;
}

/**
 * Generate a single question
 */
async function generateSingleQuestion(category) {
  const prompt = `Generate 1 simple ${category} quiz question. Output JSON: {"question":"...","options":["A","B","C","D"],"correctIndex":0}`;

  try {
    const response = await generateCompletion(prompt, {
      maxTokens: 200,
      temperature: 0.8
    });

    const parsed = parseSingleQuestion(response);
    if (!isValidQuestion(parsed)) {
      return null;
    }

    return {
      category,
      question: parsed.question,
      options: parsed.options,
      correctIndex: parsed.correctIndex
    };
  } catch (error) {
    console.error('[QuestionService] Generation error:', error);
    return null;
  }
}

/**
 * Verify question by asking LLM to solve it
 * Returns: { valid: boolean, fixedIndex?: number }
 */
async function verifyQuestion(question) {
  const verifyPrompt = `${question.question} Answer with just the answer.`;

  try {
    const response = await generateCompletion(verifyPrompt, {
      maxTokens: 50,
      temperature: 0.1, // Low temperature for consistent answers
      systemPrompt: 'Answer questions directly and concisely. Output only the answer.'
    });

    if (!response) {
      return { valid: false };
    }

    const llmAnswer = response.trim();
    const markedAnswer = question.options[question.correctIndex];

    // Check if LLM's answer matches the marked correct answer
    const normalizedLLM = normalizeAnswer(llmAnswer);
    const normalizedMarked = normalizeAnswer(markedAnswer);

    if (normalizedLLM === normalizedMarked ||
        normalizedLLM.includes(normalizedMarked) ||
        normalizedMarked.includes(normalizedLLM)) {
      console.log('[QuestionService] Verification passed:', question.question);
      return { valid: true };
    }

    // Answer doesn't match - try to find correct option
    const correctIndex = findAnswerInOptions(llmAnswer, question.options);

    if (correctIndex !== -1 && correctIndex !== question.correctIndex) {
      console.log('[QuestionService] Fixing correctIndex:', question.correctIndex, '->', correctIndex);
      return { valid: true, fixedIndex: correctIndex };
    }

    console.log('[QuestionService] Verification failed. LLM said:', llmAnswer, 'Marked:', markedAnswer);
    return { valid: false };
  } catch (error) {
    console.error('[QuestionService] Verification error:', error);
    return { valid: false };
  }
}

/**
 * Generate and verify a single question with retries
 */
async function generateVerifiedQuestion(category, index) {
  for (let attempt = 1; attempt <= MAX_VERIFICATION_ATTEMPTS; attempt++) {
    console.log(`[QuestionService] Generating question ${index + 1}, attempt ${attempt}`);

    // Generate question
    const question = await generateSingleQuestion(category);
    if (!question) {
      console.log('[QuestionService] Generation failed, retrying...');
      continue;
    }

    // Verify question
    const verification = await verifyQuestion(question);

    if (verification.valid) {
      // Apply fix if needed
      if (verification.fixedIndex !== undefined) {
        question.correctIndex = verification.fixedIndex;
      }

      return {
        id: `llm_${Date.now()}_${index}`,
        ...question,
        verified: true
      };
    }
  }

  // All attempts failed - return null to use fallback
  console.log('[QuestionService] All verification attempts failed, will use fallback');
  return null;
}

/**
 * Generate a verified question set
 * @param {string} difficulty - EASY, MEDIUM, or HARD
 * @param {string[]} categories - Question categories
 * @param {number} count - Number of questions needed
 * @returns {Promise<Object[]>} Array of verified question objects
 */
export async function generateQuestionSet(difficulty, categories, count) {
  console.log('[QuestionService] Generating verified question set:', { difficulty, categories, count });

  if (!isModelReady()) {
    console.log('[QuestionService] LLM not ready, using fallback questions');
    const questions = getRandomFallbackQuestions(categories, count);
    questions._source = 'fallback';
    return questions;
  }

  const questions = [];
  const categoriesList = Array.isArray(categories) ? categories : [categories];
  let llmSuccessCount = 0;

  for (let i = 0; i < count; i++) {
    const category = categoriesList[i % categoriesList.length];

    const question = await generateVerifiedQuestion(category, i);

    if (question) {
      questions.push(question);
      llmSuccessCount++;
    } else {
      // Use fallback for this question
      const fallback = getRandomFallbackQuestions([category], 1)[0];
      if (fallback) {
        fallback.id = `fallback_${Date.now()}_${i}`;
        questions.push(fallback);
      }
    }
  }

  // Determine source
  if (llmSuccessCount === count) {
    questions._source = 'llm';
  } else if (llmSuccessCount > 0) {
    questions._source = 'mixed';
  } else {
    questions._source = 'fallback';
  }

  console.log('[QuestionService] Final set:', questions.length, 'questions,', llmSuccessCount, 'from LLM, source:', questions._source);
  return questions;
}

/**
 * Quick check if LLM is available
 */
export function isLLMAvailable() {
  return isModelReady();
}

export default {
  generateQuestionSet,
  isLLMAvailable
};
