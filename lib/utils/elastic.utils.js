/**
 *
 * /utils/
 *
 * elastic.utils.js
 *
 **/

'use strict';

module.exports = {
  formatForDeletion: (docs) => {
    return docs.map((doc) => doc.id);
  },
  mapBrands: (data = [{}]) => {
    return data.map((brand) => {
      const {
        custom_url: { url = '' },
        id = '',
        meta_description = '',
        meta_keywords = [],
        name = '',
        page_title = '',
        search_keywords = '',
      } = brand;

      const bucket = 'brand';

      return {
        bucket,
        id,
        meta_description,
        meta_keywords,
        name,
        page_title,
        search_keywords,
        url,
      };
    });
  },
  parseResponse: (response, key = []) => {
    const [success, errors] = response.reduce(
      ([success, errors], obj) => {
        const { deleted = undefined, errors: errs } = obj;
        if (deleted) return [[...success, obj], [...errors]];
        if (errs && errs.length === 0) return [[...success, obj], [...errors]];
        return [[...success], [...errors, obj]];
      },
      [[], []]
    );
    const message = [
      `Attempted ${response.length} operations...`,
      `${success.length} documents successfully updated`,
    ];
    errors.forEach((err) => {
      const { id } = err;

      const { name = undefined } = key.find((obj) => obj.id === id);

      const msg = `Failed to update ${name ? id + ': ' + name : id}`;

      message.push(msg);
    });

    return message;
  },
  partitionAndFormatProducts: (
    products = [{}],
    categoryKey = [{}],
    brandKey = [{}]
  ) => {
    return products.reduce(
      ([toUpdate, toDelete], product) => {
        const {
          brand_id = '',
          calculated_price = '',
          categories: categoriesRaw = [],
          custom_url: { url = '' },
          date_created = '',
          date_modified = '',
          description = '',
          gtin = '',
          id: rawId = '',
          is_featured = false,
          is_visible = false,
          meta_description = '',
          meta_keywords = [],
          mpn = '',
          name = '',
          page_title = '',
          price = '',
          search_keywords = '',
          sort_order = 0,
          total_sold = 0,
          upc = '',
          view_count = 0,
        } = product;

        const id = `bc2eP${rawId}`;

        if (!is_visible) return [[...toUpdate], [...toDelete, { id, name }]];

        const categories = categoriesRaw.map((cat) => {
          const { name = '' } =
            categoryKey.find((key) => key.id === cat) || cat;
          return name;
        });

        const { name: brand = '' } = brandKey.find(
          (brand) => brand.id === brand_id
        ) || { name: '' };

        const bucket = 'product';

        const formatted = {
          brand,
          bucket,
          calculated_price,
          categories,
          date_created,
          date_modified,
          description,
          gtin,
          id,
          is_featured,
          meta_description,
          meta_keywords,
          mpn,
          name,
          page_title,
          price,
          search_keywords,
          sort_order,
          total_sold,
          upc,
          url,
          view_count,
        };

        return [[...toUpdate, formatted], [...toDelete]];
      },
      [[], []]
    );
  },
};
