const path = require("path");
const substringIndex = require("indexed-substring-search");
const fs = require("fs");
const log = require("log-less-fancy")();
const readline = require('readline')

function loadJson(filePath) {
  log.info("Reading " + filePath);
  return JSON.parse(fs.readFileSync(filePath)).items;
}

let id = 0;

// Indexes a single lookup entry
function index(entry, builder) {
  id++;
  builder.idToObject[id] = entry.hit;
  if (!entry.text) return log.warn("Unknown item: " + JSON.stringify(entry));
  for (const rec of Object.entries(entry.text)) {
    const [scoreStr, texts] = rec;
    const score = parseInt(scoreStr) / 100.0;
    if (!Number.isFinite(score))
      return log.warn(`Score "${score}" is not a number.`);
    if (!Array.isArray(texts))
      return log.warn(`Key "${url}" does not have correct structure`);
    texts.forEach(text =>
      builder.addSentence(text, {
        key: id,
        score: score
      })
    );
  }
}

function indexJson(filePath, builder) {
  log.info("Laster " + filePath);
  const input = loadJson(filePath);
  Object.keys(input).forEach(key => {
    const entry = input[key];
    index(entry, builder)
  });
}

function indexJsonLines(filePath, builder) {
  log.info("Laster " + filePath);

  const readInterface = readline.createInterface({
    input: fs.createReadStream(filePath),
    console: false
  });

  readInterface.on('line', function (line) {
    if (line.length <= 0) return
    const entry = JSON.parse(line)
    index(entry, builder);
  });
}

module.exports = class lookupIndex {
  constructor(dataPath) {
    log.info("Loading index...");
    this.nohits = loadJson(path.join(dataPath, "nohits.json"));
    this.emptyquery = loadJson(path.join(dataPath, "emptyquery.json"));
    const builder = new substringIndex.SuffixTree();
    builder.idToObject = {};
    fs.readdirSync(dataPath).forEach(fn => {
      if (fn.indexOf("full-text-index") < 0) return;
      const filepath = path.join(dataPath, fn)
      if (filepath.endsWith('.json'))
        indexJson(filepath, builder);
      else
        indexJsonLines(filepath, builder);
      log.info("Done loading index.");
    });
    this.index = builder.buildIndex();
    this.idToObject = builder.idToObject;
  }

  runQuery(q) {
    if (!q) return this.emptyquery;
    const result = this.index.queryPhrase(q);
    console.debug(q, result.length);
    if (!Object.keys(result)) return this.nohits;
    return result.slice(0, 20).map(e => {
      const f = Object.assign(e, this.idToObject[e.key]);
      delete f.key;
      return f;
    });
  }

  query(q) {
    const r = this.runQuery(q);
    r.query = q;
    return r;
  }
};
