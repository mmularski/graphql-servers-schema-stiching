import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { getAuthToken } from '../client/auth';
import { schema as stichedSchema } from '../schema';
import { fetchSchema } from '../schema/commercetools';

const bootstrap = async () => {
  await fetchSchema();

  const server = new ApolloServer({
    schema: stichedSchema()
  });

  return {
    start: async () => {
      const { url } = await startStandaloneServer(server, {
        context: async ({ req, res }) => ({
          authorization: await getAuthToken()
        })
      });
      console.log(`🚀 Server ready at ${url}`);
    },
    stop: async () => await server.stop()
  }
}

void bootstrap()
  .then(async server => {
    await server.start()

    process.on('SIGTERM', () => {
      server.stop().then(() => process.exit(1))
    })
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
