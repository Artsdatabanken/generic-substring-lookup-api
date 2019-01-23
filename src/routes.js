const path = require("path");

module.exports = function(app, lookupIndex) {
  app.get("*?", (req, res) => {
    const path = decodeURIComponent(req.path).substring(1);
    res.setHeader("Content-Type", "application/json");
    const result = lookupIndex.query(path);
    res.send({ query: path, result: result });
  });
};
