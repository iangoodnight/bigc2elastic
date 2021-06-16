/**
 *
 * bigcommerce.service.js
 *
 **/

'use strict';

const axios = require('axios');

module.exports = (function () {
  function generateBigCHeaders() {
    const { BIGC_AUTH_TOKEN: TOKEN } = process.env;

    const headers = {
      'Content-Type': 'application/json',
      'X-Auth-Token': TOKEN,
    };

    return { headers };
  }

  async function listCategories() {
    const { BIGC_STORE_HASH: HASH } = process.env;

    const url = `https://api.bigcommerce.com/stores/${HASH}/v3/catalog/categories`;

    const config = generateBigCHeaders();

    const response = await axios.get(url, config);

    const {
      data: { data },
    } = response;

    return data;
  }

  async function* fetchProducts() {
    const { BIGC_STORE_HASH: HASH } = process.env;

    const config = generateBigCHeaders();

    let url = `https://api.bigcommerce.com/stores/${HASH}/v3/catalog/products`;

    while (url) {
      const response = await axios.get(url, config);

      const {
        data: {
          data,
          meta: {
            pagination: {
              links: { next = undefined },
            },
          },
        },
      } = response;

      const [baseUrl] = url.split('?');

      url = next && baseUrl + next;

      yield data;
    }
  }

  return { listCategories, fetchProducts };
})();
