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

  function returnUrl(target = '') {
    const { BIGC_STORE_HASH: HASH } = process.env;

    const urlElems = [
      'https://api.bigcommerce.com/stores/',
      HASH,
      '/v3/catalog/',
      target,
    ];

    return urlElems.join('');
  }

  async function listCategories() {
    const url = returnUrl('categories');

    const config = generateBigCHeaders();

    const response = await axios.get(url, config);

    const {
      data: { data },
    } = response;

    return data;
  }

  async function* fetchBrands() {
    const config = generateBigCHeaders();

    let url = returnUrl('brands');

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

  async function* fetchProducts() {
    const config = generateBigCHeaders();

    let url = returnUrl('products');

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
  if (process.env.NODE_ENV === 'test') {
    return {
      generateBigCHeaders,
      returnUrl,
      listCategories,
      fetchBrands,
      fetchProducts,
    };
  }
  return { listCategories, fetchBrands, fetchProducts };
})();
