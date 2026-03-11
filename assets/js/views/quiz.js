/**
 * quiz.js — Interactive quiz view with multiple-choice and code-completion support.
 *
 * Flow:
 *  1. Render all questions unanswered.
 *  2. User answers each question.
 *  3. "Submit Quiz" grades everything, shows feedback, saves score.
 *  4. If allowRetry, show "Try Again" button that resets state.
 */

import { getApp } from '../app.js';
import { saveQuizAttempt, getQuizRecord } from '../store.js';
import { renderInlineWithMath } from '../utils.js';

function navArrow(item, moduleId, direction) {
  if (!item) return `<div class="nav-arrow-spacer"></div>`;
  let href = '';
  if (item.type === 'reading') href = `#/module/${moduleId}/reading/${item.id}`;
  else if (item.type === 'quiz')    href = `#/module/${moduleId}/quiz/${item.id}`;
  else if (item.type === 'lab')     href = `#/module/${moduleId}/lab`;
  const label = direction === 'prev' ? '← Previous' : 'Next →';
  const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);
  return `
    <div class="nav-arrow">
      <span class="nav-arrow-label">${label}</span>
      <a class="nav-arrow-title" href="${href}">${typeLabel}: ${item.id.toUpperCase()}</a>
    </div>`;
}

// ── Question renderers ────────────────────────────────────────

function renderMultipleChoice(q, idx) {
  const mathBlock = q.math
    ? `<div class="question-math">${window.katex ? window.katex.renderToString(q.math, { displayMode: true, throwOnError: false }) : `\\[${q.math}\\]`}</div>`
    : '';
  const options = q.options.map(opt => `
    <label class="option-label" data-qid="${q.id}" data-oid="${opt.id}">
      <input type="radio" name="q_${q.id}" value="${opt.id}" />
      <span>${renderInlineWithMath(opt.text)}</span>
    </label>`).join('');

  return `
    <div class="question-card" id="qcard_${q.id}" data-type="multiple-choice" data-qid="${q.id}">
      <div class="question-number">Question ${idx + 1}</div>
      ${mathBlock}
      <div class="question-prompt">${renderInlineWithMath(q.prompt)}</div>
      <div class="options-list">${options}</div>
      <button type="button" class="hint-toggle" data-qid="${q.id}" aria-expanded="false">
  <svg class="icon-bulb" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
    <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a2 2 0 0 0-.453-.618A5.98 5.98 0 0 1 2 6m6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1"/>
  </svg>
  <svg class="icon-close" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
  <span class="hint-label">Show hint</span>
</button>
      <div class="question-hint" id="hint_${q.id}">${renderInlineWithMath(q.hint ?? '')}</div>
      <div class="question-explanation" id="exp_${q.id}">
        <strong>Explanation:</strong> ${renderInlineWithMath(q.explanation ?? '')}
      </div>
    </div>`;
}

function renderCodeCompletion(q, idx) {
  // Replace ___BLANK___ with an input element placeholder we'll swap in after DOM insert
  const templateHtml = escapeHtml(q.codeTemplate)
    .replace('___BLANK___', `<input class="code-blank-input" id="blank_${q.id}" autocomplete="off" spellcheck="false" size="12" />`);

  return `
    <div class="question-card" id="qcard_${q.id}" data-type="code-completion" data-qid="${q.id}">
      <div class="question-number">Question ${idx + 1}</div>
      <div class="question-prompt">${renderInlineWithMath(q.prompt)}</div>
      <div class="code-template-wrap">
        <pre class="code-template"><code>${templateHtml}</code></pre>
      </div>
      <button type="button" class="hint-toggle" data-qid="${q.id}" aria-expanded="false">
  <svg class="icon-bulb" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
    <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a2 2 0 0 0-.453-.618A5.98 5.98 0 0 1 2 6m6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1"/>
  </svg>
  <svg class="icon-close" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
  <span class="hint-label">Show hint</span>
</button>
      <div class="question-hint" id="hint_${q.id}">${renderInlineWithMath(q.hint ?? '')}</div>
      <div class="question-explanation" id="exp_${q.id}">
        <strong>Explanation:</strong> ${renderInlineWithMath(q.explanation ?? '')}
      </div>
    </div>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Grading ───────────────────────────────────────────────────

function gradeQuiz(quizData) {
  let correct = 0;
  const total = quizData.questions.length;

  for (const q of quizData.questions) {
    const card = document.getElementById(`qcard_${q.id}`);
    if (!card) continue;

    if (q.type === 'multiple-choice') {
      const selected = card.querySelector('input[type="radio"]:checked');
      const selectedId = selected?.value;
      const correctOpt = q.options.find(o => o.correct);
      const isCorrect = selectedId === correctOpt?.id;
      if (isCorrect) correct++;

      // Style options
      card.querySelectorAll('.option-label').forEach(label => {
        label.classList.add('disabled');
        const oid = label.dataset.oid;
        const opt = q.options.find(o => o.id === oid);
        if (opt?.correct) label.classList.add('correct');
        else if (oid === selectedId) label.classList.add('wrong');
      });
      card.classList.add(isCorrect ? 'answered-correct' : 'answered-wrong');

    } else if (q.type === 'code-completion') {
      const input = document.getElementById(`blank_${q.id}`);
      const userAnswer = (input?.value ?? '').trim();
      const accepted = q.acceptedAnswers ?? [];
      const isCorrect = accepted.some(a => a.trim() === userAnswer);
      if (isCorrect) correct++;

      if (input) {
        input.classList.add(isCorrect ? 'correct' : 'wrong');
        input.disabled = true;
      }
      card.classList.add(isCorrect ? 'answered-correct' : 'answered-wrong');
    }

    // Show explanation
    if (quizData.showAnswersAfterSubmit) {
      const expEl = document.getElementById(`exp_${q.id}`);
      if (expEl) expEl.classList.add('visible');
    }

    // Disable hint button
    const hintBtn = card.querySelector('.hint-toggle');
    if (hintBtn) hintBtn.disabled = true;
  }

  return { correct, total, score: total > 0 ? correct / total : 0 };
}

// ── Main render ───────────────────────────────────────────────

export default function renderQuiz(quizData, moduleData) {
  const app = getApp();
  const moduleId = moduleData.id;
  const quizId = quizData.id;
  const prevRecord = getQuizRecord(moduleId, quizId);

  const questionCards = quizData.questions.map((q, i) => {
    if (q.type === 'multiple-choice') return renderMultipleChoice(q, i);
    if (q.type === 'code-completion') return renderCodeCompletion(q, i);
    return `<div class="question-card">Unknown question type: ${q.type}</div>`;
  }).join('');

  const prevScoreNote = prevRecord
    ? `<span>Best: ${Math.round(prevRecord.bestScore * 100)}% · Attempts: ${prevRecord.attempts}</span>`
    : '';

  app.innerHTML = `
    <div class="quiz-header">
      <div class="page-header-meta">
        <span class="badge badge-in-progress" style="background:${moduleData.color}22;color:${moduleData.color}">
          Module ${moduleData.order} Quiz
        </span>
        ${prevScoreNote}
      </div>
      <h1>${quizData.title}</h1>
      <div class="quiz-meta">
        <span>${quizData.questions.length} questions</span>
        <span>Pass: ${Math.round((quizData.passingScore ?? 0.7) * 100)}%</span>
        ${quizData.allowRetry ? '<span>Retries allowed</span>' : ''}
      </div>
    </div>

    <form id="quiz-form" class="question-list">
      ${questionCards}
    </form>

    <div class="quiz-actions" id="quiz-actions">
      <button class="btn btn-primary btn-lg" id="submit-btn">Submit Quiz</button>
    </div>

    <div id="quiz-result" style="display:none"></div>

    <div class="nav-arrows">
      ${navArrow(quizData.prevItem, moduleId, 'prev')}
      ${navArrow(quizData.nextItem, moduleId, 'next')}
    </div>`;


  // Hint toggles
  app.querySelectorAll('.hint-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const hintEl = document.getElementById(`hint_${btn.dataset.qid}`);
      if (hintEl) {
        const open = hintEl.classList.toggle('visible');
        btn.classList.toggle('hint-open', open);
        btn.setAttribute('aria-expanded', open);
        btn.querySelector('.hint-label').textContent = open ? 'Hide hint' : 'Show hint';
      }
    });
  });

  // Option selection styling
  app.querySelectorAll('.options-list').forEach(list => {
    list.querySelectorAll('.option-label').forEach(label => {
      label.querySelector('input')?.addEventListener('change', () => {
        list.querySelectorAll('.option-label').forEach(l => l.classList.remove('selected'));
        label.classList.add('selected');
      });
    });
  });

  // Submit
  const submitBtn = document.getElementById('submit-btn');
  submitBtn?.addEventListener('click', () => {
    const form = document.getElementById('quiz-form');
    form?.classList.add('quiz-submitted');

    const { correct, total, score } = gradeQuiz(quizData);
    const record = saveQuizAttempt(moduleId, quizId, score);
    const passed = score >= (quizData.passingScore ?? 0.7);

    // Hide submit button
    document.getElementById('quiz-actions').innerHTML = '';

    // Show result
    const resultEl = document.getElementById('quiz-result');
    resultEl.style.display = 'block';
    const retryBtn = quizData.allowRetry
      ? `<button class="btn btn-secondary" id="retry-btn">Try Again</button>`
      : '';
    const nextItem = quizData.nextItem;
    let nextBtn = '';
    if (nextItem) {
      let nextHref = '';
      if (nextItem.type === 'lab')     nextHref = `#/module/${moduleId}/lab`;
      if (nextItem.type === 'quiz')    nextHref = `#/module/${moduleId}/quiz/${nextItem.id}`;
      if (nextItem.type === 'reading') nextHref = `#/module/${moduleId}/reading/${nextItem.id}`;
      nextBtn = `<a class="btn btn-primary" href="${nextHref}">Continue →</a>`;
    }

    resultEl.innerHTML = `
      <div class="quiz-result ${passed ? 'passed' : 'failed'}">
        <div class="quiz-result-score">${correct}/${total}</div>
        <div class="quiz-result-message">${passed ? '🎉 Passed!' : '✗ Not quite — review and try again'}</div>
        <div style="font-size:var(--font-size-sm);color:var(--text-muted);margin-bottom:var(--space-5)">
          Score: ${Math.round(score * 100)}% · Best: ${Math.round(record.bestScore * 100)}% · Attempts: ${record.attempts}
        </div>
        <div class="quiz-result-actions">
          ${retryBtn}
          ${nextBtn}
          <a class="btn btn-outline" href="#/module/${moduleId}">Back to Module</a>
        </div>
      </div>`;


    // Retry
    document.getElementById('retry-btn')?.addEventListener('click', () => {
      renderQuiz(quizData, moduleData);
    });
  });
}
