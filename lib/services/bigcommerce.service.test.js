/**
 *
 * /services/
 *
 * bigcommerce.service.test.js
 *
 **/

'use strict';

const axios = require('axios');

const {
  generateBigCHeaders,
  returnUrl,
  listCategories,
  fetchBrands,
  fetchProducts,
} = require('./bigcommerce.service');

jest.mock('axios');

describe('bigCommerce services', () => {
  describe('generateBigCHeaders', () => {
    const bigCHeaders = generateBigCHeaders();

    it('should properly return axios config for bigC', () => {
      expect(process.env.BIGC_AUTH_TOKEN).toBeDefined();

      expect(bigCHeaders.headers['Content-Type']).toBe('application/json');

      expect(bigCHeaders.headers['X-Auth-Token']).toBeDefined();
    });
  });

  describe('returnUrl', () => {
    const testUrl = returnUrl('test');

    it('should format a bigC api url, taking a target as input', () => {
      expect(process.env.BIGC_STORE_HASH).toBeDefined();

      expect(testUrl).toBe(
        `https://api.bigcommerce.com/stores/${process.env.BIGC_STORE_HASH}/v3/catalog/test`
      );
    });
  });

  describe('listCategories', () => {
    it('should fetch data successfully', async () => {
      const response = {
        data: {
          data: [{ id: 'foo1' }, { id: 'foo2' }],
        },
      };

      axios.get.mockImplementationOnce(() => Promise.resolve(response));

      await expect(listCategories()).resolves.toEqual(response.data.data);

      expect(axios.get).toHaveBeenCalledWith(
        returnUrl('categories'),
        generateBigCHeaders()
      );
    });

    it('should throw on error', async () => {
      const errorMessage = 'FUBAR';

      axios.get.mockImplementationOnce(() =>
        Promise.reject(new Error(errorMessage))
      );

      await expect(listCategories()).rejects.toThrow(errorMessage);
    });
  });

  describe('fetchBrands', () => {
    it('should crawl pages and yield data', async () => {
      const firstResponse = {
        data: {
          data: [{ id: 'foo1' }, { id: 'foo2' }],
          meta: {
            pagination: {
              links: { next: '?page=2&limit=2' },
            },
          },
        },
      };
      const secondResponse = {
        data: {
          data: [{ id: 'foo3' }, { id: 'foo4' }],
          meta: {
            pagination: {
              links: {},
            },
          },
        },
      };

      axios.get
        .mockImplementationOnce(() => Promise.resolve(firstResponse))
        .mockImplementationOnce(() => Promise.resolve(secondResponse));

      const brandIterator = fetchBrands();

      const first = await brandIterator.next();

      expect(first.value).toEqual(firstResponse.data.data);
      expect(axios.get).toHaveBeenCalledWith(
        returnUrl('brands'),
        generateBigCHeaders()
      );

      const second = await brandIterator.next();

      expect(second.value).toEqual(secondResponse.data.data);

      expect(axios.get).toHaveBeenCalledWith(
        `${returnUrl('brands')}?page=2&limit=2`,
        generateBigCHeaders()
      );

      const third = await brandIterator.next();

      expect(third.done).toBe(true);
    });
  });

  describe('fetchProducts', () => {
    it('should crawl pages and yield data', async () => {
      const firstResponse = {
        data: {
          data: [{ id: 'foo1' }, { id: 'foo2' }],
          meta: {
            pagination: {
              links: { next: '?page=2&limit=2' },
            },
          },
        },
      };
      const secondResponse = {
        data: {
          data: [{ id: 'foo3' }, { id: 'foo4' }],
          meta: {
            pagination: {
              links: {},
            },
          },
        },
      };

      axios.get
        .mockImplementationOnce(() => Promise.resolve(firstResponse))
        .mockImplementationOnce(() => Promise.resolve(secondResponse));

      const productIterator = fetchProducts();

      const first = await productIterator.next();

      expect(first.value).toEqual(firstResponse.data.data);
      expect(axios.get).toHaveBeenCalledWith(
        returnUrl('products'),
        generateBigCHeaders()
      );

      const second = await productIterator.next();

      expect(second.value).toEqual(secondResponse.data.data);

      expect(axios.get).toHaveBeenCalledWith(
        `${returnUrl('products')}?page=2&limit=2`,
        generateBigCHeaders()
      );

      const third = await productIterator.next();

      expect(third.done).toBe(true);
    });
  });
});
