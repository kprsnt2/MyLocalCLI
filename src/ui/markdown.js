import { Marked } from 'marked';
import { markedTerminal } from 'marked-terminal';
import chalk from 'chalk';

// Configure marked for terminal output
const marked = new Marked(
    markedTerminal({
        code: chalk.hex('#E879F9'),
        blockquote: chalk.gray.italic,
        html: chalk.gray,
        heading: chalk.hex('#7C3AED').bold,
        firstHeading: chalk.hex('#7C3AED').bold,
        hr: chalk.gray,
        listitem: chalk.white,
        list: (body) => body,
        table: chalk.white,
        paragraph: chalk.white,
        strong: chalk.bold,
        em: chalk.italic,
        codespan: chalk.hex('#E879F9').bgHex('#1F2937'),
        del: chalk.strikethrough,
        link: chalk.hex('#3B82F6').underline,
        href: chalk.hex('#3B82F6').underline,
        reflowText: true,
        showSectionPrefix: false,
        tab: 2
    })
);

export function renderMarkdown(text) {
    try {
        return marked.parse(text);
    } catch (error) {
        // Fallback to plain text if markdown parsing fails
        return text;
    }
}

export function stripMarkdown(text) {
    // Basic markdown stripping for plain text output
    return text
        .replace(/#{1,6}\s/g, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .replace(/```[\s\S]*?```/g, '[code block]')
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')
        .trim();
}

export default {
    renderMarkdown,
    stripMarkdown
};
