'use client';

import React from 'react';

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'ordered'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'code'; text: string; language?: string };

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let buffer: string[] = [];
  let listItems: string[] | null = null;
  let orderedItems: string[] | null = null;
  let codeBuffer: string[] | null = null;
  let codeLanguage = '';

  const flushParagraph = () => {
    const text = buffer.join(' ').trim();
    if (text) blocks.push({ type: 'paragraph', text });
    buffer = [];
  };

  const flushBullets = () => {
    if (listItems && listItems.length) {
      blocks.push({ type: 'bullets', items: listItems });
    }
    listItems = null;
  };

  const flushOrdered = () => {
    if (orderedItems && orderedItems.length) {
      blocks.push({ type: 'ordered', items: orderedItems });
    }
    orderedItems = null;
  };

  const flushCode = () => {
    if (codeBuffer) {
      blocks.push({ type: 'code', text: codeBuffer.join('\n'), language: codeLanguage || undefined });
    }
    codeBuffer = null;
    codeLanguage = '';
  };

  for (const line of lines) {
    const trimmed = line.trimEnd();
    const fenceMatch = trimmed.match(/^```([\w-]+)?\s*$/);

    if (fenceMatch) {
      if (codeBuffer) {
        flushCode();
      } else {
        flushParagraph();
        flushBullets();
        flushOrdered();
        codeBuffer = [];
        codeLanguage = fenceMatch[1] || '';
      }
      continue;
    }

    if (codeBuffer) {
      codeBuffer.push(line);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushBullets();
      flushOrdered();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushBullets();
      flushOrdered();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      continue;
    }

    const bulletMatch = trimmed.match(/^\s*[-*]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      flushOrdered();
      listItems = listItems ?? [];
      listItems.push(bulletMatch[1].trim());
      continue;
    }

    const orderedMatch = trimmed.match(/^\s*(\d+)[.)]\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      flushBullets();
      orderedItems = orderedItems ?? [];
      orderedItems.push(orderedMatch[2].trim());
      continue;
    }

    const quoteMatch = trimmed.match(/^\s*>\s+(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushBullets();
      flushOrdered();
      blocks.push({ type: 'quote', text: quoteMatch[1].trim() });
      continue;
    }

    flushBullets();
    flushOrdered();
    buffer.push(trimmed.trim());
  }

  flushParagraph();
  flushBullets();
  flushOrdered();
  flushCode();

  return blocks;
}

function renderInline(text: string) {
  const parts: React.ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;

  text.replace(pattern, (match, _group, offset) => {
    if (offset > lastIndex) {
      parts.push(text.slice(lastIndex, offset));
    }

    if (match.startsWith('`') && match.endsWith('`')) {
      parts.push(
        <code key={`${offset}-code`} className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.95em] text-cyan-200">
          {match.slice(1, -1)}
        </code>
      );
    } else if (match.startsWith('**') && match.endsWith('**')) {
      parts.push(
        <strong key={`${offset}-bold`} className="font-semibold text-white">
          {match.slice(2, -2)}
        </strong>
      );
    } else if (match.startsWith('*') && match.endsWith('*')) {
      parts.push(
        <em key={`${offset}-italic`} className="italic text-white">
          {match.slice(1, -1)}
        </em>
      );
    }

    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function MarkdownMessage({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-3 text-sm leading-6 text-gray-100">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const HeadingTag = block.level === 1 ? 'h3' : block.level === 2 ? 'h4' : 'h5';
          return (
            <HeadingTag key={index} className="mt-2 text-base font-semibold text-white">
              {renderInline(block.text)}
            </HeadingTag>
          );
        }

        if (block.type === 'bullets') {
          return (
            <ul key={index} className="ml-4 list-disc space-y-1 text-gray-200">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ordered') {
          return (
            <ol key={index} className="ml-4 list-decimal space-y-1 text-gray-200">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote key={index} className="border-l-2 border-cyan-400/60 pl-3 text-gray-300">
              {renderInline(block.text)}
            </blockquote>
          );
        }

        if (block.type === 'code') {
          return (
            <pre key={index} className="overflow-x-auto rounded-2xl border border-white/10 bg-black/70 p-4 text-xs leading-5 text-cyan-100">
              <code>{block.text}</code>
            </pre>
          );
        }

        return (
          <p key={index} className="whitespace-pre-wrap text-gray-100">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
