const { ApolloServer } = require('apollo-server');
const { ApolloServerPluginLandingPageLocalDefault } = require('apollo-server-core');

async function startApolloServerForStudio(schema) {
    const port = process.env.STUDIO_PORT || 4000;

    const server = new ApolloServer({
        schema,
        csrfPrevention: true,
        cache: 'bounded',
        plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
        context: (input) => {
            return { req: input.req } ;
        }
    });

    const { url } = await server.listen( {port: port});

    console.log(`🚀 Server for studio ready at ${url}`);

    return server;
}

module.exports = {
    startApolloServerForStudio
};