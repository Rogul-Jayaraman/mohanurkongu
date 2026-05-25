# GitNexus Auto-Indexing

When opening this repo for the first time (or if GitNexus reports no indexed repos), run:

```
gitnexus analyze .
```

This ensures the knowledge graph is up-to-date before querying. The MCP server discovers newly indexed repos lazily — no restart needed.
