export function preprocessMarkdown(content: string): string {
  let globalQuote = false;
  const out: string[] = [];

  for (const line of content.split("\n")) {
    if (line.startsWith(">>")) {
      globalQuote = true;
      out.push("> " + line.slice(2).trimStart());
    } else if (globalQuote) {
      out.push("> " + line);
    } else if (line.startsWith(">")) {
      out.push(line);
      out.push(""); // ligne vide pour couper le blockquote après cette ligne
    } else {
      out.push(line);
    }
  }

  return out.join("\n");
}
