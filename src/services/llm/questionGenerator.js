import { generateCompletion, isModelReady } from './webllm';
import { CATEGORIES } from '../../utils/constants';

const MAX_RETRIES = 2;

const CATEGORY_PROMPTS = {
  math: 'arithmetic or basic algebra (addition, subtraction, multiplication, division, simple equations)',
  patterns: 'number sequences and patterns (find the next number in a series)',
  general: 'general knowledge facts (geography, science, history, nature)',
  logic: 'simple logic puzzles and word problems (lateral thinking, riddles)'
};

function buildSingleQuestionPrompt(category, difficultyHint = 'medium') {
  const categoryDescription = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.math;
  const categoryName = CATEGORIES[category.toUpperCase()]?.name || category;

  return `Generate a ${difficultyHint} difficulty ${categoryName} question about ${categoryDescription}.

Requirements:
- Question must be under 80 characters
- Exactly 4 answer options
- Wrong options must be plausible
- One correct answer

Respond ONLY with this JSON format, no other text:
{"question":"your question here","options":["A","B","C","D"],"correctIndex":0}`;
}

function buildBatchQuestionPrompt(categories, count) {
  const categoryDescriptions = categories
    .map(cat => `- ${cat}: ${CATEGORY_PROMPTS[cat] || 'general questions'}`)
    .join('\n');

  return `Generate ${count} quiz questions from these categories:
${categoryDescriptions}

Requirements for each question:
- Question under 80 characters
- Exactly 4 plausible options
- Include category field
- One correct answer (correctIndex 0-3)

Respond ONLY with a JSON array, no other text:
[{"category":"math","question":"What is 5+7?","options":["10","11","12","13"],"correctIndex":2}]`;
}

function validateQuestion(question) {
  if (!question || typeof question !== 'object') {
    return false;
  }

  if (typeof question.question !== 'string' || question.question.length === 0) {
    return false;
  }

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    return false;
  }

  if (!question.options.every(opt => typeof opt === 'string' && opt.length > 0)) {
    return false;
  }

  if (typeof question.correctIndex !== 'number' ||
      question.correctIndex < 0 ||
      question.correctIndex > 3) {
    return false;
  }

  return true;
}

function parseJSONResponse(response) {
  // Try to extract JSON from the response
  let jsonStr = response.trim();

  // Remove markdown code blocks if present
  jsonStr = jsonStr.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');

  // Try to find JSON array or object
  const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);

  if (arrayMatch) {
    jsonStr = arrayMatch[0];
  } else if (objectMatch) {
    jsonStr = objectMatch[0];
  }

  return JSON.parse(jsonStr);
}

function formatQuestion(rawQuestion, category, index) {
  return {
    id: `llm-${category}-${Date.now()}-${index}`,
    category: rawQuestion.category || category,
    question: rawQuestion.question.slice(0, 100), // Enforce max length
    options: rawQuestion.options.slice(0, 4),
    correctIndex: rawQuestion.correctIndex
  };
}

export async function generateQuestions(categories, count) {
  if (!isModelReady()) {
    console.warn('Model not ready, cannot generate questions');
    return null;
  }

  const questions = [];
  const categoriesList = Array.isArray(categories) ? categories : [categories];

  for (let i = 0; i < count; i++) {
    const category = categoriesList[i % categoriesList.length];
    let retries = 0;
    let success = false;

    while (retries <= MAX_RETRIES && !success) {
      try {
        const prompt = buildSingleQuestionPrompt(category);
        const response = await generateCompletion(prompt, {
          maxTokens: 256,
          temperature: 0.8
        });

        const parsed = parseJSONResponse(response);

        if (validateQuestion(parsed)) {
          questions.push(formatQuestion(parsed, category, i));
          success = true;
        } else {
          retries++;
        }
      } catch (error) {
        console.error(`Question generation attempt ${retries + 1} failed:`, error);
        retries++;
      }
    }

    if (!success) {
      console.warn(`Failed to generate question after ${MAX_RETRIES + 1} attempts`);
    }
  }

  return questions.length > 0 ? questions : null;
}

export async function generateQuestionBatch(categories, count) {
  if (!isModelReady()) {
    console.warn('Model not ready, cannot generate questions');
    return null;
  }

  const categoriesList = Array.isArray(categories) ? categories : [categories];
  let retries = 0;

  while (retries <= MAX_RETRIES) {
    try {
      const prompt = buildBatchQuestionPrompt(categoriesList, count);
      const response = await generateCompletion(prompt, {
        maxTokens: 1024,
        temperature: 0.8
      });

      const parsed = parseJSONResponse(response);

      if (!Array.isArray(parsed)) {
        // If single object returned, wrap in array
        const single = parsed;
        if (validateQuestion(single)) {
          return [formatQuestion(single, categoriesList[0], 0)];
        }
        retries++;
        continue;
      }

      // Validate and filter questions
      const validQuestions = parsed
        .filter(validateQuestion)
        .map((q, idx) => formatQuestion(q, q.category || categoriesList[idx % categoriesList.length], idx));

      if (validQuestions.length > 0) {
        return validQuestions;
      }

      retries++;
    } catch (error) {
      console.error(`Batch generation attempt ${retries + 1} failed:`, error);
      retries++;
    }
  }

  console.warn(`Failed to generate question batch after ${MAX_RETRIES + 1} attempts`);
  return null;
}

export default {
  generateQuestions,
  generateQuestionBatch
};
