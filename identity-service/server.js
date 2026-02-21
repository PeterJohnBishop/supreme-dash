const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express5');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
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
  
  const server = new ApolloServer({
    typeDefs,
    resolvers,
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
        if (!token) return {};

        try {
          const user = jwt.verify(token, process.env.ACCESS_SECRET);
          return { user };
        } catch (e) {
          return {};
        }
      },
    })
  );
  
  app.listen(4000, () => {
    console.log(`Server ready at http://localhost:4000/graphql`);
  });
}

startServer();