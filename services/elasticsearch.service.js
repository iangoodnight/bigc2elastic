/**
 *
 * /services/
 *
 * elasticsearch.service.js
 *
 **/

'use strict';

const axios = require('axios');

function generateElasticConfig() {
  const { ELASTIC_BEARER_TOKEN: TOKEN } = process.env;

  const authorization = `Bearer ${TOKEN}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': authorization,
  };

  return { headers };
}

async function postDocuments(docs = []) {
  const { ELASTIC_ENDPOINT: ENDPOINT } = process.env;

  const url = `${ENDPOINT}/api/as/v1/engines/bulk-search-engine/documents`;

  const config = generateElasticConfig();

  const response = await axios.post(url, docs, config);

  return response;
}

async function deleteDocuments(docs = []) {
  const { ELASTIC_ENDPOINT: ENDPOINT } = process.env;

  const url = `${ENDPOINT}/api/as/v1/engines/bulk-search-engine/documents`;

  const config = generateElasticConfig();

  const response = await axios.delete(url, docs, config);

  return response;
}

module.exports = { postDocuments, deleteDocuments };
