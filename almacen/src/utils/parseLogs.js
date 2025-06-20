// Parsea logs en formato texto a objetos con nivel, mensaje y fecha
export function parseLogs(logs) {
  return (logs || [])
    .map(line => line.replace(/\u0000/g, '').trim())
    .filter(line => line.length > 0)
    .map(line => {
      const dateMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
      let datetime = dateMatch ? dateMatch[1] : "";
      let rest = dateMatch ? line.slice(dateMatch[0].length).trim() : line;
      const match = rest.match(/(INFO|WARNING|ERROR)/i);
      const level = match ? match[1].toLowerCase() : "info";
      let msg = rest.replace(/^(INFO|WARNING|ERROR):?\s*/i, "");
      msg = msg.replace(/[.]+/g, " ").replace(/\s+/g, " ").trim();
      if (!datetime) {
        const now = new Date();
        datetime = now.toISOString().replace('T', ' ').substring(0, 19);
      }
      return { level, msg, datetime, raw: line };
    });
}