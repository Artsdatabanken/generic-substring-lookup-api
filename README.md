## Input file format

- [API Documentation](https://lookup.artsdatabanken.no/)

### hit

Object containing payload object to be returned from API when search terms match.

### text

- key: Score for a hit on the terms in the array (higher is better)
- value: Array of search terms associated with the score

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
