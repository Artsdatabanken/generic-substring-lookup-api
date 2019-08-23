const path = require("path");
const substringIndex = require("indexed-substring-search");
const fs = require("fs");
const log = require("log-less-fancy")();

function loadJson(filePath) {
  log.info("Reading " + filePath);
  return JSON.parse(fs.readFileSync(filePath));
}

function loadIndex(filePath, builder) {
  log.info("Laster " + filePath);
  const input = loadJson(filePath);
  let id = 0;
  Object.keys(input).forEach(key => {
    const entry = input[key];
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
  });
  log.info("Loading index done.");
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
      loadIndex(path.join(dataPath, fn), builder);
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
