/**
 * Lees de CSV Applicaties in en genereer SQL om de tabel public.apps te vullen.
 * Gebruik: node scripts/seed-apps-from-csv.js [pad-naar-csv]
 * Default CSV-pad: scripts/Applicaties.csv (kopieer je export hierheen) of
 *   c:\Users\KeesSchouten\Downloads\Applicaties (1).csv
 *
 * Output: supabase/seed-apps.sql (INSERT-statements). Daarna:
 *   npx supabase db execute -f supabase/seed-apps.sql
 * of in Supabase SQL Editor: inhoud van seed-apps.sql plakken en uitvoeren.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseCSVLine } from './parse-csv-line.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const CSV_PATH = process.argv[2] || path.join(__dirname, 'Applicaties.csv')

const STATUS_MAP = {
  '0. Wensenlijst': 'wensenlijst',
  '1. Oppakken': 'stories_maken', // was oppakken, status verwijderd
  '1. User stories maken': 'stories_maken',
  '2. In voorbereiding': 'in_voorbereiding',
  '2. Sprintbaar': 'in_voorbereiding',
  '3. In ontwikkeling': 'in_ontwikkeling',
  '4. Test': 'in_testfase',
  '5. Productie': 'in_productie',
  '7. Afgewezen': 'afgewezen',
}

function escapeSql(str) {
  if (str == null || str === '') return 'NULL'
  return "'" + String(str).replace(/'/g, "''") + "'"
}

function parseBool(val) {
  const v = (val || '').trim().toLowerCase()
  return v === 'waar' || v === 'true' || v === '1' ? 'true' : 'false'
}

function parseDate(val) {
  const v = (val || '').trim()
  if (!v) return 'NULL'
  const match = v.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return escapeSql(match[0])
  return 'NULL'
}

function main() {
  let content
  try {
    content = fs.readFileSync(CSV_PATH, 'utf8')
  } catch (err) {
    console.error('Fout: kon bestand niet lezen:', CSV_PATH)
    console.error(err.message)
    process.exit(1)
  }

  const lines = content.split(/\r?\n/).filter((l) => l.length > 0)
  if (lines.length < 2) {
    console.error('Fout: CSV heeft te weinig regels.')
    process.exit(1)
  }

  // Regel 0: schema (overslaan) of header. Regel 1: header als regel 0 schema was. Data daarna.
  const first = (lines[0] || '').replace(/^\uFEFF/, '')
  const hasSchemaLine = first.includes('ListSchema') && !first.startsWith('"')
  const headerLineIndex = hasSchemaLine ? 1 : 0
  const header = parseCSVLine(lines[headerLineIndex])
  const dataStart = headerLineIndex + 1
  const dataLines = lines.slice(dataStart)

  const col = (row, name) => {
    const i = header.indexOf(name)
    return i >= 0 ? (row[i] || '').trim() : ''
  }
  /** Eerste niet-lege waarde voor een van de gegeven kolomnamen */
  const colFirst = (row, ...names) => {
    for (const name of names) {
      const v = col(row, name)
      if (v) return v
    }
    return ''
  }

  const inserts = []
  for (let i = 0; i < dataLines.length; i++) {
    const row = parseCSVLine(dataLines[i])
    if (row.length < 2) continue

    const statusRaw = col(row, 'Status app') || col(row, header[0])
    const status = STATUS_MAP[statusRaw] || 'wensenlijst'
    const naam = (col(row, 'Applicatie') || col(row, header[1]) || '').trim()
    if (!naam) continue

    const aanspreekpunt_proces = col(row, 'Aanspreekpunt proces') || col(row, header[2])
    const aanspreekpunt_intern = col(row, 'Aanspreekpunt Intern') || col(row, header[3])
    const platform = col(row, 'Platform') || col(row, header[4])
    const documentatie_url = col(row, 'Documentatie') || col(row, header[5])
    const sparseRaw = col(row, 'Sparse') || col(row, header[6])
    const datum_oplevering = col(row, 'Datum oplevering') || col(row, header[7])
    const handleidingRaw = col(row, 'Handleiding aanwezig') || col(row, header[8])
    const complexiteit = col(row, 'Complexiteit') || col(row, header[9])
    const url_test = colFirst(row, 'URL test', 'Url test', 'url_test', 'URL Test')
    const url_productie = colFirst(row, 'URL productie', 'Url productie', 'url_productie', 'URL Productie')

    const sparse = parseBool(sparseRaw)
    const handleiding_aanwezig = parseBool(handleidingRaw)
    const datumSql = parseDate(datum_oplevering)

    const sql = `INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit, url_test, url_productie)
VALUES (${escapeSql(naam)}, '${status}'::public.app_status, ${escapeSql(aanspreekpunt_proces)}, ${escapeSql(aanspreekpunt_intern)}, ${escapeSql(platform)}, ${escapeSql(documentatie_url)}, ${sparse}, ${datumSql}, ${handleiding_aanwezig}, ${escapeSql(complexiteit)}, ${escapeSql(url_test)}, ${escapeSql(url_productie)});`
    inserts.push(sql)
  }

  const outPath = path.join(__dirname, '..', 'supabase', 'seed-apps.sql')
  const output = `-- Gegenereerd door scripts/seed-apps-from-csv.js op ${new Date().toISOString()}
-- Bron: ${CSV_PATH}
-- Voer uit met: npx supabase db execute -f supabase/seed-apps.sql (of plak in SQL Editor)

TRUNCATE TABLE public.apps RESTART IDENTITY CASCADE;

${inserts.join('\n\n')}
`
  fs.writeFileSync(outPath, output, 'utf8')
  console.log('Gereed: %d rijen naar %s geschreven.', inserts.length, outPath)
}

main()
