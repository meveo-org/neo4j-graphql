const { Neo4jGraphQL } = require("@neo4j/graphql");
const { ApolloServer } = require("apollo-server-express");
const { startApolloServerForStudio } = require("./apollo-studio.js");
const express = require('express');
const neo4j = require("neo4j-driver");
const fs = require("fs");
const openidAuth = require("./openid-auth.js");
const fetch = require("node-fetch");

const {
    NEO4J_URL = "bolt://localhost:7687/",
    NEO4J_USERNAME = "",
    NEO4J_PASSWORD = "",
    PORT = 7000,
    STUDIO = false,
    ENABLE_AUTH = false,
    AUTH_URL = "",
    DATABASE = "neo4j",
    ENCRYPTED = false
} = process.env;

/**
 * @type ApolloServer
 */
let server;

/**
 * @type ApolloServer
 */
let studioServer;

const config = {};

if (ENCRYPTED) {
    config.encrypted = 'ENCRYPTION_ON';
}

console.log("Neo4j config : ", config);

const driver = neo4j.driver(NEO4J_URL, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD), config);
driver.verifyConnectivity().then(result => {
    console.log(`Connection to ${result.address} successful`);
}).catch(error => {
    console.log("Connection to neo4j server failed", error);
});


async function createApolloServer(typeDefs) {
    try {
        const neoSchema = new Neo4jGraphQL({
            typeDefs, 
            driver,
            config: {
                driverConfig: {
                    database: DATABASE
                }
            }
        });

        const schema = await neoSchema.getSchema();

        if (STUDIO) {
            if (studioServer) {
                await studioServer.stop();
            }
            studioServer = await startApolloServerForStudio(schema)
        }

        server = new ApolloServer({
            schema,
            csrfPrevention: true,
            cache: 'bounded',
        });

        await server.start();

        console.log("Apollo server started");
    } catch (error) {
        console.error(error);
        throw new Error(error.message);
    }
}

async function init() {
    const app = express();

    app.use(express.json());
    app.use(express.text({limit: "50mb"}));

    if (ENABLE_AUTH) {
        console.log("Enabling authentication using open-id provider ", AUTH_URL);
    
        userInfoEndpoint = await fetch(AUTH_URL + "/.well-known/openid-configuration")
            .then(response  => {
                return response.json().then(json => {
                    return json.userinfo_endpoint;
                });
        });
        
        console.log("User-info endpoint : " + userInfoEndpoint);

        app.use(openidAuth(userInfoEndpoint));
    }

    // -- Begin methods --

    app.post("/update", async (req, res) => {
        if (!req.body) {
            res.status(400);
            res.send("Schema must be provided");
            return;
        }
    
        try {
            fs.writeFileSync("/data/graphql.sdl", req.body);
            await stopServer();
            await createApolloServer(req.body);
            res.send("Schema updated");
        } catch (error) {
            res.status(500)
            res.send(error.message);
        }
    
    });
    
    app.post("/graphql", async function (req, res) {
        const { operationName, query, variables } = req.body;

        try {
            const result = await server.executeOperation({ operationName, query, variables });

            if (result.errors) {
                res.status(400);
                res.send(result.errors[0].message);
            } else {
                res.json(result.data);
            }

        } catch (error) {
            res.status(500)
            res.send(error.message);
        }
    });

    // -- End methods --

    app.listen({ port: PORT }, () => {
        console.log(`🚀 Server ready`);
    });
}

async function stopServer() {
    if (server) {
        await server.stop();
        console.log("Apollo server stopped");
    }
}

init().then(() => {
    if (!fs.existsSync("/data/graphql.sdl")) {
        console.log("No schema defined");
    } else {
        const typeDefs = fs.readFileSync("/data/graphql.sdl");
    
        createApolloServer(typeDefs.toString())
            .catch((error) => {
                console.log("Failed to start apollo server", error);
            })
    }
})



