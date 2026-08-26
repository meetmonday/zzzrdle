import { mkdirSync, writeFileSync, readdirSync, readFileSync, rmSync } from 'fs';
import { dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = join(__dirname, '..', 'static');

const REPO = 'tgdm/zzzip';
const BRANCH = 'main';

const REPO_DIRS = ['attackType', 'attribute', 'faction', 'rarity', 'specialty'];
const LOCAL_DIR_MAP = { faction: 'factions' };

function githubHeaders() {
  const h = { 'User-Agent': 'zzzrdle-icon-sync' };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

async function githubApi(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers: githubHeaders() });
  if (!res.ok) throw new Error(`GitHub API ${path}: ${res.status}`);
  return res.json();
}

function gitBlobSha(buf) {
  const hash = createHash('sha1');
  hash.update(`blob ${buf.length}\0`);
  hash.update(buf);
  return hash.digest('hex');
}

const safeName = name => name.replaceAll(' ', '_');

async function download(path) {
  const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${encodeURI(path)}`;
  const res = await fetch(url, { headers: githubHeaders() });
  if (!res.ok) throw new Error(`Failed to download ${path}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const tree = await githubApi(`/repos/${REPO}/git/trees/${BRANCH}?recursive=1`);
  if (tree.truncated) throw new Error('Tree response truncated, reduce scope');

  const wanted = new Map();

  for (const dir of REPO_DIRS) {
    const prefix = `misc/${dir}/`;
    for (const entry of tree.tree) {
      if (entry.type !== 'blob' || !entry.path.startsWith(prefix) || !entry.path.endsWith('.png')) continue;
      const localDir = LOCAL_DIR_MAP[dir] || dir;
      wanted.set(join(localDir, safeName(basename(entry.path))), { sha: entry.sha, path: entry.path, localDir });
    }
  }

  console.log(`Upstream icons found: ${wanted.size}`);

  let added = 0;
  let updated = 0;
  let unchanged = 0;

  for (const [localRel, { sha, path, localDir }] of wanted) {
    const localPath = join(STATIC_DIR, localRel);
    const exists = existsSafe(localPath);
    if (exists && gitBlobSha(readFileSync(localPath)) === sha) {
      unchanged++;
      continue;
    }
    exists ? updated++ : added++;
    mkdirSync(dirname(localPath), { recursive: true });
    writeFileSync(localPath, await download(path));
    console.log(`${exists ? 'update' : 'add'}: ${localRel}`);
  }

  let removed = 0;
  for (const dir of [...REPO_DIRS.map(d => LOCAL_DIR_MAP[d] || d)]) {
    const dirAbs = join(STATIC_DIR, dir);
    if (!existsSafe(dirAbs)) continue;
    for (const f of readdirSync(dirAbs)) {
      if (!wanted.has(join(dir, f))) {
        rmSync(join(dirAbs, f));
        removed++;
        console.log(`remove: ${dir}/${f}`);
      }
    }
  }

  console.log(`Done: +${added} ~${updated} =${unchanged} -${removed}`);
}

function existsSafe(p) {
  try {
    readFileSync(p);
    return true;
  } catch {
    return false;
  }
}

main();
