/**
 * Parse een CSV-regel met dubbele aanhalingstekens (velden kunnen komma's bevatten).
 */
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else if (c !== '\r') {
      current += c
    }
  }
  result.push(current.trim())
  return result
}

export { parseCSVLine }
