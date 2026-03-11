/**
 * utils.js — Shared rendering utilities.
 */

/**
 * Render math in a short inline string (quiz prompt, option, hint, explanation).
 * Uses marked.parseInline for inline markdown so bold/italic also work,
 * but avoids block-level <p> wrapping.
 */
export function renderInlineWithMath(text) {
  if (!text) return '';

  const blocks = [];
  // Must NOT start with < — an HTML comment at the start of a list item
  // triggers marked's HTML block mode, which suppresses **bold** etc.
  const placeholder = (i) => `ꙈMATHBLOCKꙈ${i}Ꙉ`;

  let processed = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    blocks.push({ math, display: true });
    return placeholder(blocks.length - 1);
  });
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    blocks.push({ math, display: false });
    return placeholder(blocks.length - 1);
  });

  // parseInline renders bold/italic without wrapping in <p>
  let html = window.marked?.parseInline
    ? window.marked.parseInline(processed)
    : processed;

  blocks.forEach(({ math, display }, i) => {
    const rendered = window.katex
      ? window.katex.renderToString(math, { displayMode: display, throwOnError: false })
      : (display ? `\\[${math}\\]` : `\\(${math}\\)`);
    html = html.split(placeholder(i)).join(rendered);
  });

  return html;
}

/**
 * Parse markdown while preserving math expressions.
 *
 * marked.parse() escapes backslashes and treats underscores as italic markers,
 * which breaks LaTeX. We extract all \(...\) and \[...\] blocks first, render
 * them with katex.renderToString, then splice the rendered HTML back in.
 */
export function parseContentWithMath(markdown) {
  if (!markdown) return '';

  const blocks = [];
  // HTML comments as placeholders — marked passes them through untouched.
  // Must NOT start with < — an HTML comment at the start of a list item
  // triggers marked's HTML block mode, which suppresses **bold** etc.
  const placeholder = (i) => `ꙈMATHBLOCKꙈ${i}Ꙉ`;

  // Extract display math \[...\] before inline to avoid overlap
  let text = markdown.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    blocks.push({ math, display: true });
    return placeholder(blocks.length - 1);
  });

  // Extract inline math \(...\)
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    blocks.push({ math, display: false });
    return placeholder(blocks.length - 1);
  });

  // Run markdown on the now-math-free text
  let html = window.marked ? window.marked.parse(text) : text;

  // Render each math block with KaTeX and splice back
  blocks.forEach(({ math, display }, i) => {
    const rendered = window.katex
      ? window.katex.renderToString(math, { displayMode: display, throwOnError: false })
      : (display ? `\\[${math}\\]` : `\\(${math}\\)`);
    html = html.split(placeholder(i)).join(rendered);
  });

  return html;
}
