const path = require("path");
const express = require("express");
const log = require("log-less-fancy")();
const minimist = require("minimist");
const routes = require("./routes");
const pjson = require("../package.json");
const LookupIndex = require("./lookupIndex");

var argv = minimist(process.argv.slice(2), {
  alias: { p: "port" },
  alias: { path: "dataPath" }
});
if (argv._.length === 1) {
  console.log("Usage: node index.js [options]");
  console.log("");
  console.log("Options:");
  console.log("   -p PORT --port PORT  Set the HTTP port [9876]");
  console.log(
    "   --dataPath           Directory containing the search index [./data/]"
  );
  console.log("");
  process.exit(1);
}

const app = express();

app.use(function(req, res, next) {
  res.header("X-Powered-By", pjson.name + " " + pjson.version);
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET");
  res.header("Access-Control-Expose-Headers", "Content-Length");
  res.header(
    "Access-Control-Allow-Headers",
    "Accept, Authorization, Content-Type, X-Requested-With"
  );
  if (req.method === "OPTIONS") {
    return res.send(200);
  } else {
    return next();
  }
});

const lookupIndex = new LookupIndex(argv.dictionary || "./data/");
routes(app, lookupIndex);

const port = argv.port || 9876;
app.listen(port, () => {
  log.info("Server listening on port " + port);
});
