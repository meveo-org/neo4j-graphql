# Neo4j GraphQl Server

Uses `@neo4j/graphql` and `apollo-server-express` / `apollo-server` to connect a neo4j database with a graphQl server and schema.

## General configuration

| Name | Description | Default |
|------| ----------- |---------|
| NEO4J_URL | Url of neo4j db | bolt://localhost:7687/ |
| NEO4J_USERNAME | Username to connect to db| |
| NEO4J_PASSWORD | Password to connect to db | |
| PORT | Port where the app will be available | 7000 |
| STUDIO | Whether to start a second server where apollo studio can connect | false |
| STUDIO_PORT | Port where the appolo server will be available | 4000 |
| ENABLE_AUTH | Whether to enable authentication | false |
| AUTH_URL | OpenID Connect issuer URL | | 

## API Specification

### Update graphQl schema

- `POST /update`
- `Content-Type : text/plain`
- Body : the new GraphQL schema to apply to the server

### Query database against current schema

- `POST /graphql`
- `Content-Type : application/json`

```json
{
    "query": "the graphql query to execute",
    "variables": "variables of the query",
    "operationName": "Name of the graphQl operation, can be ommitted"
}
```

## Authentication

The authentication mechanism works for open-id connect providers, by querying the userInfo endpoint with the given bearer token of the incoming request.

To enable authentication, set those environment variables : 

- ENABLE_AUTH=true
- AUTH_URL=<AUTH_ISSUER_URL>

## Usage with Apollo Studio

Set env variable `STUDIO=true`, then a raw Apollo Server will be available at the port defined by `STUDIO_PORT`.
