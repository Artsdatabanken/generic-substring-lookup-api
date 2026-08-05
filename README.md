# generic-substring-lookup-api

A lightweight HTTP API for fast **substring lookup** against one or more prebuilt search index files.

The service loads JSON-based search data into memory at startup and exposes a simple query endpoint for autocomplete-style lookup and search integrations.

- API docs UI: [https://lookup.artsdatabanken.no/](https://lookup.artsdatabanken.no/)
- Runtime: Node.js
- Framework: Express
- Search engine: [`indexed-substring-search`](https://www.npmjs.com/package/indexed-substring-search)

## Features

- Fast in-memory substring search
- Simple HTTP API with JSON responses
- Swagger UI available at `/` and `/api-docs`
- Supports loading multiple index files from the `data/` directory
- Dockerized runtime for deployment

## Project Structure

- `src/index.js` - application entrypoint and server bootstrap
- `src/routes.js` - API route definitions
- `src/lookupIndex.js` - index loading and query logic
- `src/swagger.js` / `src/swagger.json` - Swagger UI setup and API definition
- `data/` - search index files and fallback responses
- `Dockerfile` - production container image
- `azure-pipelines-*.yml` - CI/CD pipelines for Docker image build and push

## Requirements

- Node.js
- npm
- Optional: Docker

> Recommended: use a Node.js version compatible with the Docker image. The repository currently builds with **Node 21** in Docker.

## Installation

Install dependencies from the project root:

```bash
npm install
```

## Running Locally

Start the API directly with Node:

```bash
node src/index.js --port 9876 --dataPath ./data/
```

Then open:

- Swagger UI: `http://localhost:9876/`
- Swagger UI alt path: `http://localhost:9876/api-docs`
- Query endpoint example: `http://localhost:9876/v1/query?q=lecanorales`

### Development Mode

A dev script exists:

```bash
npm run dev
```

> Needs verification: the current script runs `nodemon -e js` without explicitly specifying the app entrypoint, so behavior may depend on your local environment.

## API

### Query endpoint

`GET /v1/query?q=<text>`

Example:

```bash
curl "http://localhost:9876/v1/query?q=lecanorales"
```

Example response shape:

```json
{
  "query": "lecanorales",
  "result": [
    {
      "score": 9.13,
      "title": "Kantlavordenen",
      "url": "Biota/Fungi/Ascomycota/Pezizomycotina/Lecanoromycetes/Lecanorales"
    }
  ]
}
```

### Behavior notes

- Missing or empty queries return the contents of `data/emptyquery.json`
- Queries with no matches return the contents of `data/nohits.json`
- The API returns up to **20 results**

## Input Data Format

The index is built from files in `data/` whose names contain `full-text-index`.

The current implementation supports:
- `.json` files containing an object with an `items` field
- non-`.json` files treated as newline-delimited JSON entries

### Entry structure

Each entry contains:

#### `hit`
Object containing the payload returned by the API when one or more search terms match.

#### `text`
Map where:
- **key** = score for a hit on the listed terms, where higher is better
- **value** = array of search terms associated with that score

Example:

```json
{
  "hit": {
    "title": "Kantlavordenen",
    "url": "Biota/Fungi/Ascomycota/Pezizomycotina/Lecanoromycetes/Lecanorales"
  },
  "text": {
    "587": [
      "AR-128057",
      "Pezizomycotina",
      "Ekte sekksporesopper",
      "Ekte sekksporesoppar"
    ],
    "652": ["AR-127735", "Lecanoromycetes", "Kantlaver", "Kantlavar"],
    "913": ["Lecanorales", "Kantlavordenen", "Kantlavordenen"],
    "932": ["AR-1001"]
  }
}
```

### Data directory contents

Expected supporting files in `data/`:

- `emptyquery.json` - fallback response when `q` is missing or empty
- `nohits.json` - fallback response when no search results are found
- `full-text-index*` - one or more search index source files

## Docker

Build the image:

```bash
docker build -t generic-substring-lookup-api .
```

Run the container:

```bash
docker run --rm -p 9876:9876 -v "$(pwd)/data:/data" generic-substring-lookup-api
```

The container starts the service with:

```bash
node --max_old_space_size=8192 src/index.js --port 9876 --dataPath /data/
```

## Testing

Current test command:

```bash
npm test
```

At the moment this is only a placeholder and does not run an automated test suite.

## Deployment

The repository includes Azure Pipelines configuration:

- `azure-pipelines-test.yml` - builds and pushes the Docker image tagged `test` on the `test` branch
- `azure-pipelines-prod.yml` - builds and pushes the Docker image tagged `latest` on the `master` branch

There is also a `deploy.sh` helper that logs in to Docker Hub, pushes the image, and posts a Slack notification for `master`.

## Known Caveats / Needs Verification

A few implementation details are worth checking before making operational assumptions:

- `src/index.js` documents `--dataPath`, but the code currently constructs `LookupIndex` using `argv.dictionary || "./data/"`.
  - This may mean `--dataPath` is not actually used as intended.
- The no-hit check in `src/lookupIndex.js` uses `if (!Object.keys(result))`, which may not correctly detect an empty result depending on the returned data type.
- `npm run dev` may not start the service correctly in every environment.

## Troubleshooting

### The API starts but returns no useful data

Check that:
- `data/emptyquery.json` exists and is valid JSON
- `data/nohits.json` exists and is valid JSON
- at least one file containing `full-text-index` exists in `data/`
- the search input structure matches the expected schema

### Query returns empty/no-hit responses unexpectedly

- verify that the query parameter is named `q`
- test with exact known terms from the source data
- inspect the loaded `full-text-index*` files

### High memory usage at startup

The index is built fully in memory. For large datasets:
- expect significant startup memory usage
- consider increasing runtime memory limits
- reduce or split dataset size if needed

## Contributing

When updating this service:

1. Keep route handlers minimal and put search logic in `src/lookupIndex.js`
2. Preserve the current CommonJS module style unless intentionally refactoring the whole codebase
3. Update Swagger documentation if API behavior changes
4. Validate changes with representative data files
5. Verify Docker behavior if changing startup or runtime assumptions

## References

- Express: https://expressjs.com/
- Swagger UI Express: https://www.npmjs.com/package/swagger-ui-express
- indexed-substring-search: https://www.npmjs.com/package/indexed-substring-search
- Azure Pipelines Docker task: https://learn.microsoft.com/azure/devops/pipelines/tasks/reference/docker-v2
