import { delegateToSchema } from '@graphql-tools/delegate';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { loadSchemaSync } from '@graphql-tools/load';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { OperationTypeNode } from 'graphql';
import path from 'path';
import { Customer } from '../../generated/graphql';
import { getSchema as commercetoolsSchema } from './commercetools';

const SCHEMA_FILENAME = 'custom.schema.graphql';
const extensionTypeDefs = loadSchemaSync(path.join(__dirname, `./${SCHEMA_FILENAME}`), { loaders: [new GraphQLFileLoader()] })

const resolvers = {
  Customer: {
    MMU_TEST: () => 'test 123',
    id: (res: Record<string, unknown>) => {
      return `${res.id}-some-added-string`;
    }
  },
  Query: {
    mmuCustomersQuery: async (parent: any, args: any, contextValue: any, info: any) => {
      const originalResult: Customer = await delegateToSchema({
        args,
        schema: commercetoolsSchema(),
        info,
        operation: OperationTypeNode.QUERY,
        context: contextValue,
        fieldName: 'customer'
      });

      console.log('Original result', originalResult);

      // return originalResult.map((entry) => ({
      //   ...entry,
      //   email: 'overwritten_email'
      // }));

      return {
        ...originalResult, email: 'overwritten_email@foo.baz'
      };
    }
  }
};

export const getSchema = makeExecutableSchema({
  typeDefs: extensionTypeDefs,
  resolvers
});
