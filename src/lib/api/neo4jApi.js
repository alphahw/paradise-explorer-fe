import neo4j from 'neo4j-driver/lib/browser/neo4j-web.min.js';

import { env } from '$lib/env.js';

const MAX_NODE_LIMIT = 5000;

const neo4jUrl = env.VITE_NEO4J_URL;

let neo4jVersion = env.VITE_NEO4J_VERSION;
if (!neo4jVersion) {
  // assume Neo4j 4 by default
  neo4jVersion = '4';
}

let database = env.VITE_NEO4J_DATABASE;
if (!neo4jVersion.startsWith('4')) {
  database = null;
}

const driver = neo4j.driver(
  neo4jUrl,
  neo4j.auth.basic(env.VITE_NEO4J_USER, env.VITE_NEO4J_PASSWORD)
);

console.log(`Database running at ${neo4jUrl}`);

// TODO: Transation string building like this is highly unsafe, bad idea

const searchNodes = async (type, properties = [], values = []) => {
  const session = driver.session({ database: database });
  return await session
    .readTransaction((tx) => {
      const typeStr = type ? ':' + type : '';

      let propertyStr = '';
      if (properties.length && values.length) {
        propertyStr = properties.reduce((prevVal, currVal, i) => {
          return (
            prevVal +
            (prevVal.length ? ' AND WHERE ' : ' WHERE ') +
            `toLower(n.${currVal})` +
            `CONTAINS toLower("${values[i]}")`
          );
        }, '');
      }

      const txStr = `MATCH (n${typeStr})\
      ${propertyStr} \
      RETURN n \
      LIMIT ${MAX_NODE_LIMIT}`;

      return tx.run(txStr, {});
    })
    .then((result) => {
      if (!result.records.length) {
        return null;
      }

      const nodes = [];

      result.records.forEach((rec) => {
        const node = rec.get('n');

        if (!node) return;

        const cleanNode = Object.assign({}, node);
        delete cleanNode.identity;
        cleanNode.id = node.identity.toString();
        nodes.push(cleanNode);
      });

      return {
        nodes
      };
    })
    .catch((error) => {
      throw error;
    })
    .finally(() => {
      return session.close();
    });
};

const getNodesAndLinks = async (
  type,
  properties = [],
  values = [],
  lowerLinkLimit = 1,
  upperLinkLimit = 2
) => {
  const session = driver.session({ database: database });
  return await session
    .readTransaction((tx) => {
      const typeStr = type ? ':' + type : '';

      let propertyStr = '';
      if (properties.length && values.length) {
        propertyStr =
          ' {' +
          properties.reduce((prevVal, currVal, i) => {
            return prevVal + (prevVal.length ? ', ' : '') + currVal + `: "${values[i]}"`;
          }, '') +
          '}';
      }

      let txStr = `MATCH p = (a${typeStr}${propertyStr})\
      -[*${lowerLinkLimit}..${upperLinkLimit}]-(b) WITH *, relationships(p) AS l \
      RETURN a, b, l \
      LIMIT ${MAX_NODE_LIMIT}`;

      return tx.run(txStr, {});
    })
    .then((result) => {
      if (!result.records.length) {
        return null;
      }

      const nodes = [];
      const links = [];

      result.records.forEach((rec) => {
        const a = rec.get('a');
        const b = rec.get('b');

        [a, b].forEach((node) => {
          if (!node) return;

          const cleanNode = Object.assign({}, node);
          delete cleanNode.identity;
          cleanNode.id = node.identity.toString();
          nodes.push(cleanNode);
        });

        const l = rec.get('l');
        if (l.length) {
          l.forEach((link) => {
            const cleanLink = Object.assign({}, link);
            delete cleanLink.identity;
            cleanLink.id = link.identity.toString();
            cleanLink.start = link.start.toString();
            cleanLink.end = link.end.toString();
            links.push(cleanLink);
          });
        }
      });

      return {
        nodes,
        links
      };
    })
    .catch((error) => {
      throw error;
    })
    .finally(() => {
      return session.close();
    });
};

export default {
  searchNodes,
  getNodesAndLinks
};
