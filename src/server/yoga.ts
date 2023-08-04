import 'dotenv/config';
import { createYoga } from 'graphql-yoga';
import { createServer } from 'node:http';
import { getAuthToken } from '../client/auth';
import { schema as stichedSchema } from '../schema';
import { fetchSchema } from '../schema/commercetools';

(async function bootstrap() {
  await fetchSchema();

  const yoga = createYoga({
    schema: stichedSchema(),
    context: async (context) => ({
      ...context,
      authorization: await getAuthToken()
    }),
    logging: 'debug'
  })

  const server = createServer(yoga)

  server.listen(4000, () => {
    console.info('🚀 Server is running on http://localhost:4000/graphql')
  })

  process.on('SIGTERM', () => {
    server.close(() => process.exit(1));
  })
})();
