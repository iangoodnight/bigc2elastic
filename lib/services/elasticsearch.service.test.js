/**
 *
 * /services/
 *
 * elastic.service.test.js
 *
 **/

'use strict';

const axios = require('axios');

const {
  generateElasticConfig,
  returnElasticEndPoint,
  deleteDocuments,
  fetchDocuments,
  postDocuments,
} = require('./elasticsearch.service');

jest.mock('axios');

describe('elasticsearch services', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('returnElasticEndPoint', () => {
    const elasticEndpoint = returnElasticEndPoint();

    it('should correctly generate elastic endpoint', () => {
      expect(process.env.ELASTIC_ENDPOINT).toBeDefined();

      expect(process.env.ELASTIC_ENGINE).toBeDefined();

      expect(elasticEndpoint).toBe(
        `${process.env.ELASTIC_ENDPOINT}/api/as/v1/engines/${process.env.ELASTIC_ENGINE}/documents`
      );

      delete process.env.ELASTIC_ENDPOINT;

      try {
        const badEndPoint = returnElasticEndPoint();
      } catch (err) {
        expect(err.message).toBe('Elastic endpoint not found');
      }
    });
  });

  describe('generateElasticEndPoint', () => {
    it('should generate axios config for elasticsearch calls', () => {
      expect(process.env.ELASTIC_BEARER_TOKEN).toBeDefined();

      const testConfig = generateElasticConfig();

      expect(testConfig.headers).toBeDefined();

      expect(testConfig.headers['Content-Type']).toBe('application/json');

      expect(testConfig.headers.Authorization).toBe(
        `Bearer ${process.env.ELASTIC_BEARER_TOKEN}`
      );
    });
  });

  describe('deleteDocuments', () => {
    it('should post deletes successfully', async () => {
      const response = {
        data: [{ id: 'foo1' }, { id: 'foo2' }],
      };

      const testConfig = generateElasticConfig();

      const testDocs = ['foo1', 'foo2'];

      testConfig.data = testDocs;

      axios.delete.mockImplementationOnce(() => Promise.resolve(response));

      await expect(deleteDocuments(['foo1', 'foo2'])).resolves.toEqual(
        response
      );

      await expect(deleteDocuments([])).resolves.toEqual([]);

      expect(axios.delete).toBeCalledWith(returnElasticEndPoint(), testConfig);
    });
  });

  describe('fetchDocuments', () => {
    it('should fetch documents and yield data', async () => {
      const firstResponse = {
        data: {
          meta: {
            page: { total_pages: 2 },
          },
          results: [{ id: 'foo1' }, { id: 'foo2' }],
        },
      };

      const secondResponse = {
        data: {
          meta: {
            page: { total_pages: 2 },
          },
          results: [{ id: 'foo3' }, { id: 'foo4' }],
        },
      };

      axios.get
        .mockImplementationOnce(() => Promise.resolve(firstResponse))
        .mockImplementationOnce(() => Promise.resolve(secondResponse));

      const docIterator = fetchDocuments();

      const first = await docIterator.next();

      const mockHeaders = generateElasticConfig();

      delete mockHeaders.headers['Content-Type'];

      let mockUrl = returnElasticEndPoint();

      expect(first.value).toEqual(firstResponse.data.results);

      expect(axios.get).toHaveBeenCalledWith(
        mockUrl + '/list?page[size]=100&page[current]=1',
        mockHeaders
      );

      const second = await docIterator.next();

      expect(second.value).toEqual(secondResponse.data.results);

      expect(axios.get).toHaveBeenCalledWith(
        mockUrl + '/list?page[size]=100&page[current]=2',
        mockHeaders
      );

      const doneResponse = await docIterator.next();

      expect(doneResponse.done).toBe(true);
    });
  });
});
