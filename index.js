#!/usr/bin/env node

/**
 * bigC2elastic
 * index.js
 **/

'use strict';

const axios = require('axios');

const chalk = require('chalk');

const {
  bigC: { listCategories, fetchProducts },
  elastic: { postDocuments },
} = require('./services');

const { bigC: { partitionAndFormat } } = require('./utils');

const { log } = console;

require('dotenv').config();

function formatProductsForElasticSearch(data = []) {
  return data.map(product => {
    const {
      id,
      name,
      type,
      sku,
      description,
      price,
      search_keywords,
      custom_url: { url }
    } = product;

    return { id, name, type, sku, description, price, search_keywords, url };
  });
}

async function run () {
  log(chalk.green('Starting sync...'));
  log(chalk.blue('Fetching categories from BigC...'));

  const categoryResponse = await listCategories();

  const [ visibleCategories, hiddenCategories ] =
    partitionAndFormat(categoryResponse);

  log(chalk.magenta('Deleting hidden categories...'));

  const deleteCategoryResponse = await deleteDocuments(hiddenCategories);

  log(chalk.red(`Deleted ${deleteCategoryResponse}`));

  const deleteCategoryErrs = deleteCategoryResponse.reduce()
  let totalPages = 0;
  const iterator = fetchProducts();

  for await (const page of iterator) {
    totalPages++;
    log(chalk.blue(`Page: ${totalPages}`));

    const formatted = formatProductsForElasticSearch(page);

    for (const product of formatted) {
      log(chalk.green(product.name));
    }
    log(chalk.magenta('Posting to Elastic search...'));

    const result = await postDocuments(formatted);

    if (result.status === 200) log(chalk.green('Success'));
    if (result.status !== 200) log(chalk.red('Failed', result.status));
  }
  log(chalk.blue('Finished'));
}

// run();
async function test() {
  const categories = await listCategories();
  const [visible, hidden] = partitionAndFormat(categories);
  await postDocuments(visible);
  await postDocuments(hidden);
  console.log('Visible', visible);
  console.log('Invisible', hidden);
}

test();
