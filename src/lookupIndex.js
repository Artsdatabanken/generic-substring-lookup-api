const path = require("path");
const substringIndex = require("indexed-substring-search");
const fs = require("fs");
const log = require("log-less-fancy")();

function loadIndex(filePath) {
  const input = JSON.parse(fs.readFileSync(filePath));
  const builder = new substringIndex.SuffixTree();
  const idToObject = {};
  let id = 0;
  Object.keys(input).forEach(url => {
    const entry = input[url];
    id++;
    idToObject[id] = { url: url, title: entry.title };
    for (const rec of Object.entries(entry)) {
      if (rec[0] === "title") {
        continue;
      }
      //      console.log(rec);
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
  return { index: builder.buildIndex(), idToObject };
}

module.exports = class lookupIndex {
  constructor(dataPath) {
    log.info("Loading index...");
    this.nohits = "no hits";
    this.emptyquery = "empty query";
    const fn = path.join(dataPath, "full-text-index.json");
    const li = loadIndex(fn);
    this.index = li.index;
    this.idToObject = li.idToObject;
  }

  query(q) {
    if (!q) return this.emptyquery;
    const result = this.index.queryPhrase(q);
    console.debug(q, result.length);
    if (!Object.keys(result)) return this.nohits;
    return result.slice(0, 20).map(e => {
      return Object.assign(e, this.idToObject[e.key]);
    });
  }
};
