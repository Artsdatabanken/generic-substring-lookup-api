module.exports = function(app, lookupIndex) {
  app.get("/v1/query", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const result = lookupIndex.query(req.query.q);
    res.send({ query: req.query.q, result: result });
  });
};
