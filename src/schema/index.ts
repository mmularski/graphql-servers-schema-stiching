import { stitchSchemas } from "@graphql-tools/stitch";
import { getSchema as commercetools } from './commercetools';
import { getSchema as custom } from './custom';

export const schema = () => stitchSchemas({
  subschemas: [commercetools(), custom]
});