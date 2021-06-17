/**
 *
 * /utils/
 *
 * bigcommerce.utils.js
 *
 **/

'use strict';

function formatCategory(category = {}) {
  const {
    custom_url: { url },
    description,
    id: rawId,
    is_visible,
    meta_description,
    meta_keywords,
    name,
    page_title,
    search_keywords,
    sort_order,
    views: view_count,
  } = category;

  const id = `bc2eC${rawId}`;

  const bucket = 'category';

  const formatted = {
    bucket,
    description,
    id,
    meta_description,
    meta_keywords,
    name,
    page_title,
    search_keywords,
    sort_order,
    url,
    view_count,
  };

  if (is_visible) return [is_visible, formatted];
  return [false, { id, name }];
}

module.exports = {
  partitionAndFormat: (data = []) => {
    return data.reduce(
      ([active, inactive], category) => {
        const [isVisible, formatted] = formatCategory(category);
        return isVisible
          ? [[...active, formatted], inactive]
          : [active, [...inactive, formatted]];
      },
      [[], []]
    );
  },
};

if (process.env.NODE_ENV === 'test') {
  module.exports.formatCategory = formatCategory;
}
