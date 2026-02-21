const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express5');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');
const mongoose = require('mongoose');
const express = require('express');
const http = require('http');
const cors = require('cors');
const { json } = require('body-parser');
const jwt = require('jsonwebtoken');
const typeDefs = require('./graphql/typeDefs')
const resolvers = require('./graphql/resolvers')

require('dotenv').config();

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault({ footer: false }),
    ],
  });

  await server.start();

await mongoose.connect(process.env.MONGODB_URI);
  app.use(
    '/graphql',
    cors(),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const auth = req.headers.authorization || '';
        const token = auth.replace('Bearer ', '');
        if (!token) return { user: null };

        try {
          const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
          return { user: decoded };
        } catch (e) {
          return { user: null };
        }
      },
    })
  );
  
  await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
  console.log(`Server ready at http://localhost:4000/graphql`);
}

startServer();