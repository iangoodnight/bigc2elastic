/**
 *
 * /services/
 *
 * elasticsearch.service.js
 *
 **/

'use strict';

const axios = require('axios');

async function* fetchDocuments() {
  const config = generateElasticConfig();

  delete config.headers['Content-Type'];

  let url = returnElasticEndPoint();

  const pageSize = 'page[size]=100';

  let current = 1;

  while (url) {
    const target = `${url}/list?${pageSize}&page[current]=${current}`;

    const response = await axios.get(target, config);

    const {
      data: {
        results,
        meta: {
          page: { total_pages },
        },
      },
    } = response;

    if (total_pages === current) url = null;

    current++;

    yield results;
  }
}

function returnElasticEndPoint() {
  const { ELASTIC_ENDPOINT: ENDPOINT, ELASTIC_ENGINE: ENGINE } = process.env;

  if (ENDPOINT === undefined) throw new Error('Elastic endpoint not found');

  return `${ENDPOINT}/api/as/v1/engines/${ENGINE}/documents`;
}

function generateElasticConfig() {
  const { ELASTIC_BEARER_TOKEN: TOKEN } = process.env;

  const authorization = `Bearer ${TOKEN}`;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: authorization,
  };

  return { headers };
}

async function postDocuments(docs = []) {
  const url = returnElasticEndPoint();

  const config = generateElasticConfig();

  if (docs.length > 0) {
    const response = await axios.post(url, docs, config);

    return response;
  }
  return [];
}

async function deleteDocuments(docs = []) {
  const url = returnElasticEndPoint();

  const config = generateElasticConfig();

  if (docs.length > 0) {
    config.data = docs;

    const response = await axios.delete(url, config);

    return response;
  }
  return [];
}

module.exports = { fetchDocuments, postDocuments, deleteDocuments };
