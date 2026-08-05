# CONTINUE.md

## Project Overview

This project is a lightweight **substring lookup API** built with **Node.js** and **Express**. It serves search results from one or more precomputed full-text index files stored in the `data/` directory.

### Purpose
The service accepts query text over HTTP and returns matching results from a substring index. It appears intended for lookup/autocomplete or search-driven integrations where the dataset is loaded from JSON-based index files.

### Key Technologies
- **Node.js** runtime
- **Express** for HTTP routing
- **indexed-substring-search** for in-memory substring indexing/search
- **swagger-ui-express** for interactive API documentation
- **Docker** for packaging/runtime
- **Azure Pipelines** for CI/CD

### High-Level Architecture
- `src/index.js` boots the server, parses CLI args, configures headers/CORS, and wires dependencies.
- `src/routes.js` exposes the HTTP API endpoint.
- `src/lookupIndex.js` loads index data from disk, builds the in-memory search index, and executes queries.
- `src/swagger.js` and `src/swagger.json` provide API documentation UI.
- Docker and Azure pipeline files build and publish container images.

---

## Getting Started

### Prerequisites
- **Node.js** installed locally, ideally a modern version compatible with the project. The Dockerfile uses **Node 21**, so that is a good default to verify.
- **npm**
- Optional: **Docker** for containerized execution

### Installation
Install dependencies from the repository root:

```bash
npm install
```

### Running Locally
Start the server directly:

```bash
node src/index.js --port 9876 --dataPath ./data/
```

There is also a dev script using nodemon:

```bash
npm run dev
```

> **Needs verification:** the `dev` script only runs `nodemon -e js` and does not explicitly specify the entrypoint. If it does not start the app automatically in your environment, run `node src/index.js` directly or update the script.

### API Usage Example
Query the API:

```bash
curl "http://localhost:9876/v1/query?q=lecanorales"
```

Swagger UI is available at:
- `/`
- `/api-docs`

Example:

```bash
open http://localhost:9876/api-docs
```

### Running Tests
The current `test` script does not run real tests:

```bash
npm test
```

At the moment it exits successfully after printing a placeholder message.

> **Needs verification / improvement:** there is currently no implemented automated test suite in `package.json`.

---

## Project Structure

### Top-Level Directories and Files
- `src/` - application source code
- `data/` - search index input files and fallback response payloads
- `.continue/rules/` - Continue project rules and documentation
- `Dockerfile` - container build/runtime definition
- `package.json` - project metadata, dependencies, and scripts
- `package-lock.json` - locked dependency versions
- `README.md` - brief input data format notes
- `deploy.sh` - image push/deploy notification helper
- `azure-pipelines-test.yml` - CI pipeline for `test` branch Docker image build/push
- `azure-pipelines-prod.yml` - CI pipeline for `master` branch Docker image build/push
- `Modelfile` - local LLM/model configuration artifact; not part of the runtime service itself

### Source Files
- `src/index.js`
  - Main application entrypoint
  - Parses CLI arguments
  - Configures response headers and permissive CORS
  - Instantiates `LookupIndex`
  - Registers routes and Swagger UI
  - Starts the HTTP server

- `src/routes.js`
  - Defines the `/v1/query` endpoint
  - Accepts `q` as a query parameter
  - Returns `{ query, result }`

- `src/lookupIndex.js`
  - Loads JSON data from the configured data directory
  - Builds a suffix-tree-based substring index
  - Handles lookup result mapping from internal IDs to payload objects
  - Returns fallback payloads for empty queries and no-hit cases

- `src/swagger.js`
  - Mounts Swagger UI at `/` and `/api-docs`

- `src/swagger.json`
  - OpenAPI/Swagger definition used by the UI

### Data Files
Observed examples:
- `data/full-text-index.json` - main search index source
- `data/nohits.json` - fallback response for unmatched queries
- `data/emptyquery.json` - fallback response for empty queries

### Important Configuration Files
- `package.json` - dependency and script configuration
- `Dockerfile` - production container setup
- `azure-pipelines-test.yml` and `azure-pipelines-prod.yml` - deployment automation

---

## Development Workflow

### Coding Style and Conventions
Based on the existing codebase:
- Source uses **CommonJS** (`require`, `module.exports`)
- Formatting is simple and mostly consistent with semicolons and double quotes
- The app is intentionally minimal, with logic concentrated in a few files

Recommended conventions when extending the project:
- Keep route handlers thin and business/search logic inside dedicated modules
- Preserve CommonJS style unless intentionally migrating the entire project
- Add comments only where behavior is non-obvious
- Prefer small, focused changes because the service is compact and easy to reason about

### Testing Approach
Current state:
- No real automated tests are configured
- Manual verification is likely the current default approach

Recommended additions:
- Add API tests for `/v1/query`
- Add unit tests for `lookupIndex.js` loading and query behavior
- Test empty query handling, no-hit behavior, and top-N result limits

### Build and Deployment Process
#### Local Build
Run directly with Node.js or build a Docker image.

#### Docker
The Dockerfile:
- installs production dependencies
- copies the app into `/app`
- runs as a non-root user
- exposes port `9876`
- starts the service with:

```bash
node --max_old_space_size=8192 src/index.js --port 9876 --dataPath /data/
```

#### CI/CD
Azure Pipelines is configured for two branches:
- `test` branch builds and pushes Docker tag `test`
- `master` branch builds and pushes Docker tag `latest`

`deploy.sh` also logs in to Docker Hub, pushes the image, and sends a Slack notification on `master`.

> **Needs verification:** actual deployment beyond image publishing is not fully represented in the repository. The Slack notification suggests an external deployment process may exist.

### Contribution Guidance
Suggested team workflow for this repo:
1. Update or add data/index files carefully
2. Run the app locally against representative data
3. Verify `/v1/query` behavior and Swagger UI
4. If changing indexing logic, validate result ranking and output structure
5. Keep container behavior compatible with existing Azure pipelines

---

## Key Concepts

### Lookup Entry Format
The README documents the primary input shape. Each indexed record contains:
- `hit`: payload returned to API clients when a match is found
- `text`: map of score to an array of searchable terms

Conceptually:
- multiple searchable phrases can point to a single returned hit object
- score values influence ranking
- scores are stored as strings in JSON and converted to numeric values during indexing

### In-Memory Search Index
The service builds an in-memory suffix-tree-based index at startup. This implies:
- startup time depends on the size of the data files
- memory usage can be significant for large datasets
- query performance should be fast once the index is loaded

### Fallback Responses
Two fallback datasets are loaded at startup:
- `emptyquery.json` for missing/empty `q`
- `nohits.json` when no results are found

### Query Flow
1. Client calls `/v1/query?q=...`
2. Route delegates to `lookupIndex.query(q)`
3. The search engine runs a phrase query
4. Results are mapped back to original `hit` payloads
5. Up to 20 results are returned

---

## Common Tasks

### Start the API Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Ensure the `data/` directory contains valid index files
3. Start the server:
   ```bash
   node src/index.js --port 9876 --dataPath ./data/
   ```
4. Open Swagger UI or query the endpoint directly

### Add or Update Search Data
1. Prepare data matching the documented structure in `README.md`
2. Place or update files in `data/`
   - include `full-text-index` in the filename so the loader picks them up
3. Restart the service so the in-memory index is rebuilt
4. Validate sample queries against expected results

### Change the API Response or Routing
1. Update route behavior in `src/routes.js`
2. If needed, update result construction in `src/lookupIndex.js`
3. Update `src/swagger.json` to keep docs aligned with implementation
4. Test with curl and Swagger UI

### Run with Docker
Build the image:

```bash
docker build -t generic-substring-lookup-api .
```

Run the container:

```bash
docker run --rm -p 9876:9876 -v "$(pwd)/data:/data" generic-substring-lookup-api
```

### Investigate Startup/Data Loading Issues
1. Confirm `--dataPath` points to the correct directory
2. Verify `emptyquery.json` and `nohits.json` exist and contain valid JSON
3. Verify at least one file containing `full-text-index` is present
4. Check logs during startup for file loading messages

---

## Troubleshooting

### No Results Returned
Possible causes:
- query string does not match indexed terms
- index files were not loaded
- data file format does not match expected structure

Checks:
- inspect `data/full-text-index*`
- verify the query parameter is passed as `q`
- review startup logs for file loading messages

### Empty Query Behavior Seems Unexpected
The service returns the contents of `emptyquery.json` when `q` is empty or missing. If behavior seems wrong:
- inspect `data/emptyquery.json`
- test both missing and blank query values

### Service Starts but Data Seems Missing
Check for a likely implementation detail in `src/index.js`:
- the CLI help mentions `--dataPath`
- the `LookupIndex` constructor currently uses `argv.dictionary || "./data/"`

> **Needs verification:** this appears inconsistent and may mean `--dataPath` is ignored in practice. Review and test argument handling before relying on custom data paths.

### Large Memory Usage
The Docker command uses `--max_old_space_size=8192`, which suggests index loading can be memory-intensive for large datasets. If memory pressure occurs:
- reduce dataset size
- split data if supported by your workflow
- increase container/runtime memory allocation
- profile startup/index size

### Potential Result Handling Edge Case
In `src/lookupIndex.js`, no-hit detection uses:
- `if (!Object.keys(result)) return this.nohits;`

> **Needs verification:** depending on the result type returned by `indexed-substring-search`, this condition may not correctly detect empty results. Confirm behavior with no-match queries.

### Dev Script Does Not Behave as Expected
If `npm run dev` does not start the app correctly, run:

```bash
node src/index.js --port 9876 --dataPath ./data/
```

and consider updating `package.json` with an explicit nodemon target.

---

## References

### In-Repo References
- `README.md` - input data format notes
- `src/swagger.json` - API contract/documentation
- `package.json` - scripts and dependencies
- `Dockerfile` - runtime/container details
- Azure pipeline YAML files - CI/CD flow

### External References
- Express: https://expressjs.com/
- Swagger UI Express: https://www.npmjs.com/package/swagger-ui-express
- indexed-substring-search: https://www.npmjs.com/package/indexed-substring-search
- Azure Pipelines Docker task docs: https://learn.microsoft.com/azure/devops/pipelines/tasks/reference/docker-v2

---

## Notes for Future Maintainers

This repository is intentionally small, so a large part of maintainability depends on keeping the following aligned:
- input data format
- indexing logic
- API response shape
- Swagger documentation
- Docker/runtime assumptions

When making changes, prioritize validating real query behavior with representative datasets.
