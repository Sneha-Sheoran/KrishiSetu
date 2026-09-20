import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const enPath = path.join(rootDir, 'messages', 'en.json')
const hiPath = path.join(rootDir, 'messages', 'hi.json')

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'))
const hi = JSON.parse(fs.readFileSync(hiPath, 'utf8'))

function getFlattenedKeys(obj, prefix = '') {
  let keys = []
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getFlattenedKeys(v, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

const enKeys = new Set(getFlattenedKeys(en))
const hiKeys = new Set(getFlattenedKeys(hi))

console.log('====================================================')
console.log('   STEP 1: Checking Key Parity (en.json vs hi.json)  ')
console.log('====================================================')

let hasMismatch = false

for (const key of enKeys) {
  if (!hiKeys.has(key)) {
    console.error(`[MISSING IN HI] ${key}`)
    hasMismatch = true
  }
}

for (const key of hiKeys) {
  if (!enKeys.has(key)) {
    console.error(`[MISSING IN EN] ${key}`)
    hasMismatch = true
  }
}

if (!hasMismatch) {
  console.log(`✓ en.json and hi.json have 100% identical key sets (${enKeys.size} keys)!`)
} else {
  console.error('✗ Key mismatch detected between en.json and hi.json!')
}

console.log('\n====================================================')
console.log('   STEP 2: Scanning Scope Files for Untranslated Strings')
console.log('====================================================')

const scopePaths = [
  'app/[locale]/marketplace',
  'app/[locale]/buyer',
  'app/[locale]/messages',
  'components/marketplace',
  'components/buyer',
  'components/Navbar.tsx',
  'components/MobileNav.tsx',
  'components/GuestNavbar.tsx',
  'components/GuestMobileNav.tsx',
  'app/actions/marketplace.ts',
  'app/actions/buyer.ts'
]

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles
  const stat = fs.statSync(dirPath)
  if (!stat.isDirectory()) {
    return [dirPath]
  }
  const files = fs.readdirSync(dirPath)
  for (const file of files) {
    const full = path.join(dirPath, file)
    if (fs.statSync(full).isDirectory()) {
      getAllFiles(full, arrayOfFiles)
    } else if (/\.(tsx|ts)$/.test(file)) {
      arrayOfFiles.push(full)
    }
  }
  return arrayOfFiles
}

let allFiles = []
for (const sp of scopePaths) {
  allFiles = allFiles.concat(getAllFiles(path.join(rootDir, sp)))
}

// Patterns that might indicate hardcoded English text in JSX:
// e.g. placeholder="Something in English", aria-label="Something", title="Something", or raw JSX text >English Word<
const placeholderRegex = /placeholder=["']([A-Za-z\s.,!?()]+)["']/g
const ariaLabelRegex = /aria-label=["']([A-Za-z\s.,!?()]+)["']/g
const titleRegex = /title=["']([A-Za-z\s.,!?()]+)["']/g

let potentialIssues = 0

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8')
  const relPath = path.relative(rootDir, file)
  const lines = content.split('\n')

  lines.forEach((line, idx) => {
    // Skip comments and imports
    const trimmed = line.trim()
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('import ')) {
      return
    }

    let match
    while ((match = placeholderRegex.exec(line)) !== null) {
      // If it looks like raw english words rather than curly braces or empty
      if (match[1].length > 3 && !match[1].startsWith('{')) {
        console.warn(`[WARN] Hardcoded placeholder in ${relPath}:${idx + 1}: "${match[1]}"`)
        potentialIssues++
      }
    }

    while ((match = ariaLabelRegex.exec(line)) !== null) {
      if (match[1].length > 3 && !match[1].startsWith('{')) {
        console.warn(`[WARN] Hardcoded aria-label in ${relPath}:${idx + 1}: "${match[1]}"`)
        potentialIssues++
      }
    }

    while ((match = titleRegex.exec(line)) !== null) {
      if (match[1].length > 3 && !match[1].startsWith('{')) {
        console.warn(`[WARN] Hardcoded title in ${relPath}:${idx + 1}: "${match[1]}"`)
        potentialIssues++
      }
    }
  })
}

console.log(`\nScan completed across ${allFiles.length} files. Potential hardcoded attribute warnings: ${potentialIssues}`)

if (hasMismatch) {
  process.exit(1)
} else {
  console.log('✓ Check passed successfully!')
}
