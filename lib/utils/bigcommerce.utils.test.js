/**
 *
 * /utils/
 *
 * bigcommerce.utils.test.js
 *
 **/

'use strict';

const { formatCategory, partitionAndFormat } = require('./bigcommerce.utils');

describe('bigcommerce utils', () => {
  const visibleCategory = {
    custom_url: { url: '/test/foo' },
    description: 'Foobar',
    id: 10,
    is_visible: true,
    meta_description: 'Foo bar baz',
    meta_keywords: 'Do not affect SEO',
    name: 'Foo',
    page_title: 'Foo | Test',
    search_keywords: 'foo bar baz',
    sort_order: 1,
    views: 0,
  };

  const hiddenCategory = {
    custom_url: { url: '/test/bar' },
    description: 'Barfoo',
    id: 11,
    is_visible: false,
    meta_description: 'Bar baz foo',
    meta_keywords: 'Do not affect SEO',
    name: 'Bar',
    page_title: 'Bar | Test',
    search_keywords: 'bar baz foo',
    sort_order: 2,
    views: 1,
  };

  describe('formatCategory', () => {
    const [visibleTest, visibleResult] = formatCategory(visibleCategory);

    const [hiddenTest, hiddenResult] = formatCategory(hiddenCategory);

    it('should identify hidden and visible categories', () => {
      expect(visibleTest).toBe(true);

      expect(hiddenTest).toBe(false);
    });

    it('should add the `bucket` key and value to visible categories', () => {
      expect(visibleResult.bucket).toBe('category');

      expect(hiddenResult.bucket).not.toBeDefined();
    });

    it('should rename the key `views to `view_count', () => {
      expect(visibleResult.view_count).toBeDefined();

      expect(visibleCategory.views).toBe(visibleResult.view_count);
    });

    it('should strip unnecessary information from hidden categories', () => {
      expect(hiddenResult.description).not.toBeDefined();

      expect(hiddenResult.id).toBeDefined();

      expect(hiddenResult.meta_description).not.toBeDefined();

      expect(hiddenResult.meta_keywords).not.toBeDefined();

      expect(hiddenResult.name).toBe('Bar');

      expect(hiddenResult.page_title).not.toBeDefined();

      expect(hiddenResult.search_keywords).not.toBeDefined();

      expect(hiddenResult.sort_order).not.toBeDefined();

      expect(hiddenResult.url).not.toBeDefined();

      expect(hiddenResult.view_count).not.toBeDefined();
    });

    it('should return all pertinent information from visible categories', () => {
      expect(visibleResult.description).toBe('Foobar');

      expect(visibleResult.id).toBeDefined();

      expect(visibleResult.meta_description).toBe('Foo bar baz');

      expect(visibleResult.meta_keywords).toBe('Do not affect SEO');

      expect(visibleResult.name).toBe('Foo');

      expect(visibleResult.page_title).toBe('Foo | Test');

      expect(visibleResult.search_keywords).toBe('foo bar baz');

      expect(visibleResult.sort_order).toBe(1);

      expect(visibleResult.url).toBe('/test/foo');

      expect(visibleResult.view_count).toBe(0);
    });

    it('should namespace the id with `bc2eC`', () => {
      expect(visibleResult.id).toBe('bc2eC10');

      expect(hiddenResult.id).toBe('bc2eC11');
    });
  });

  describe('partitionAndFormat', () => {
    const data = [hiddenCategory, visibleCategory];

    const [active, hidden] = partitionAndFormat(data);

    it('should return paritioned arrays based on visiblity', () => {
      expect(Array.isArray(active)).toBe(true);

      expect(Array.isArray(hidden)).toBe(true);

      expect(active.length).toBe(1);

      expect(hidden.length).toBe(1);

      expect(active[0].name).toBe('Foo');

      expect(hidden[0].name).toBe('Bar');
    });
  });
});
