import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { loadSchemaSync } from "@graphql-tools/load";
import { wrapSchema } from '@graphql-tools/wrap';
import { HttpsAgent } from 'agentkeepalive';
import fs from 'fs';
import { GraphQLSchema, buildClientSchema, getIntrospectionQuery, print, printSchema } from 'graphql';
import fetch from 'node-fetch';
import path from 'path';
import { getAuthToken } from "../client/auth";

const GRAPHQL_URL = `https://api.europe-west1.gcp.commercetools.com/${process.env.CTP_PROJECT_KEY}/graphql`;
const SCHEMA_FILENAME = 'commercetools.schema.graphql';

let schema: undefined | GraphQLSchema;

export const getSchema = () => {
  if (schema) {
    return schema;
  }

  const schemaLoad = loadSchemaSync(
    path.join(__dirname, `./${SCHEMA_FILENAME}`),
    {
      loaders: [new GraphQLFileLoader()],
    }
  );

  schema = wrapSchema({
    schema: schemaLoad,
    executor: schemaExecutor(GRAPHQL_URL),
  });

  return schema;
};

export const fetchSchema = async () => {
  const authorizationHeader = await getAuthToken()

  const getGraphQLSchema = async () => {
    try {
      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authorizationHeader,
        },
        body: JSON.stringify({ query: getIntrospectionQuery() }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch schema');
      }

      const { data } = await response.json();

      return data; // The fetched GraphQL schema introspection
    } catch (error) {
      console.error('Error fetching schema:', (error as Record<string, unknown>).message);
      return null;
    }
  };

  const schema = await getGraphQLSchema();
  // const schemaString = JSON.stringify(schema, null, 2);

  fs.writeFileSync(path.join(__dirname, `./${SCHEMA_FILENAME}`), printSchema(buildClientSchema(schema)));

  console.log(`Commercetools GraphQL schema saved to ./${SCHEMA_FILENAME}`);
};

const schemaExecutor = (endpoint: string) => {
  const keepAliveAgent = new HttpsAgent();

  return async ({ document, variables, context }: any) => {
    const query = print(document);

    const fetchResult = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: context.authorization,
      },
      body: JSON.stringify({ query, variables }),
      agent: keepAliveAgent,
    });

    const res = await fetchResult.json();

    if (res.error || res.errors?.length) {
      const uninterestingErrorCodes = ['ConcurrentModification'];

      if (!res.errors?.length ||
        (res.errors?.length &&
          !res.errors.some((e: any) =>
            uninterestingErrorCodes.includes(e.code)
          ))
      ) {
        console.error(
          `Error in CT call ${JSON.stringify(query)}: ${res.error
          } ${JSON.stringify(res.errors)}`
        );
      }
    }

    return res;
  };
};
