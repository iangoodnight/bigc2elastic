#!/usr/bin/env node

/**
 * bigC2elastic
 * index.js
 **/

'use strict';

/**
 *
 * Dependencies and constants
 *
 **/

const chalk = require('chalk');

const {
  bigC: { listCategories, fetchBrands, fetchProducts },
  elastic: { fetchDocuments, deleteDocuments, postDocuments },
} = require('./lib/services');

const {
  bigC: { partitionAndFormat },
  elastic: {
    formatForDeletion,
    mapBrands,
    parseResponse,
    partitionAndFormatProducts,
  },
} = require('./lib/utils');

const { log, time, timeEnd } = console;

require('dotenv').config();

const fs = require('fs');

const inquirer = require('inquirer');

const ui = new inquirer.ui.BottomBar();

const [, , ...flags] = process.argv;

const ONLY_PRODUCTS = flags.indexOf('--products-only') !== -1;

const DROP = flags.indexOf('--drop') !== -1;

const NO_BRANDS = flags.indexOf('--no-brands') !== -1;

const NO_CATEGORIES = flags.indexOf('--no-categories') !== -1;

let INIT = flags.indexOf('--init') !== -1;

const { env: e } = process;

if (
  !e.BIGC_STORE_HASH ||
  !e.BIGC_AUTH_TOKEN ||
  !e.ELASTIC_ENDPOINT ||
  !e.ELASTIC_ENGINE ||
  !e.ELASTIC_BEARER_TOKEN
)
  INIT = true;

/**
 *
 * MAIN
 *
 **/

async function run() {
  /**
   *
   * Labels/housekeeping
   *
   **/

  const processLabel = 'Elasticsearch Sync';

  let functionLabel;

  time(processLabel);

  log(chalk.blue('Starting sync...'));

  /**
   *
   * If --drop, fetch and drop docs in batches of 100
   *
   **/

  if (DROP) {
    const iterator = fetchDocuments();

    let ids = [];

    functionLabel = 'Dropped existing documents';

    time(functionLabel);
    log(chalk.magenta('Drop requested...'));

    let docPage = 1;

    for await (const page of iterator) {
      log(chalk.magenta(`Fetching page ${docPage}`));
      for (const doc of page) {
        const { id, name } = doc;
        ids.push({ id, name });
      }
      docPage++;
    }

    while (ids.length > 0) {
      const hundredDocs = ids.splice(0, 100);

      log(chalk.magenta('Dropping in batches of 100'));

      const { data: dropResponse } = await deleteDocuments(
        formatForDeletion(hundredDocs)
      );

      const [runner, result, ...rest] = parseResponse(
        dropResponse,
        hundredDocs
      );

      log(chalk.magenta(runner));
      log(chalk.green(result));

      for (const exception of rest) {
        log(chalk.yellow(exception));
      }
    }

    timeEnd(functionLabel);
  }

  /**
   *
   * Fetch categories to provide cateogry names to product docs.
   * Unless --no-categories or --products-only, push category docs to
   * elasticsearch in batches of 100
   *
   **/

  functionLabel = 'Fetch categories';

  time(functionLabel);

  log(chalk.magenta('Fetching categories from BigC...'));

  const categoryResponse = await listCategories();

  timeEnd(functionLabel);

  if (!ONLY_PRODUCTS && !NO_CATEGORIES) {
    let [visibleCategories, hiddenCategories] =
      partitionAndFormat(categoryResponse);

    log(chalk.magenta('Deleting hidden categories...'));

    functionLabel = 'Deleted hidden categories';

    time(functionLabel);

    const { data: deleteCategoryResponse } = await deleteDocuments(
      formatForDeletion(hiddenCategories)
    );

    const [runner, result, ...rest] = parseResponse(
      deleteCategoryResponse,
      hiddenCategories
    );

    log(chalk.magenta(runner));
    log(chalk.green(result));

    for (const unDeleted of rest) {
      log(chalk.yellow(unDeleted));
    }

    timeEnd(functionLabel);

    functionLabel = 'Updated categories';

    time(functionLabel);

    log(chalk.magenta('Updating categories'));

    while (visibleCategories.length > 0) {
      if (visibleCategories.length > 100) {
        const firstHundredCategories = visibleCategories.splice(0, 100);

        const { data: postedCategories = [] } = await postDocuments(
          firstHundredCategories
        );

        const [categoryRunner, updatedResult, ...rest] = parseResponse(
          postedCategories,
          firstHundredCategories
        );

        log(chalk.magenta(categoryRunner));
        log(chalk.green(updatedResult));

        for (const remaining of rest) {
          log(chalk.yellow(remaining));
        }
      } else {
        const { data: postedCategories = [] } = await postDocuments(
          visibleCategories
        );

        const [categoryRunner, updatedResult, ...rest] = parseResponse(
          postedCategories,
          visibleCategories
        );
        log(chalk.magenta(categoryRunner));
        log(chalk.green(updatedResult));

        for (const remaining of rest) {
          log(chalk.yellow(remaining));
        }

        visibleCategories.length = 0;
      }
    }

    timeEnd(functionLabel);
  }

  /**
   *
   * Fetch brands to provide brand names to product docs.
   * Unless --no-brands or --products-only, push resulting brand docs up to
   * elasticsearch in batches of 100.
   *
   **/

  functionLabel = 'Fetch brands';

  time(functionLabel);

  log(chalk.magenta('Mapping brands'));

  let brandPages = 0;
  const brandIterator = fetchBrands();

  const brandArray = [];

  for await (const brandPage of brandIterator) {
    brandPages++;

    log(chalk.blue(`Page: ${brandPages}`));

    brandArray.push(...brandPage);
  }

  const brandKey = mapBrands(brandArray);

  timeEnd(functionLabel);

  if (!ONLY_PRODUCTS && !NO_BRANDS) {
    functionLabel = 'Updating brands';

    time(functionLabel);

    let formattedBrands = brandKey.map((brand) => {
      const formatted = { ...brand };
      formatted.id = 'bc2eB' + brand.id;
      return formatted;
    });

    while (formattedBrands.length > 0) {
      if (formattedBrands.length > 100) {
        const firstHundredBrands = formattedBrands.splice(0, 100);

        const { data: postedBrands = [] } = await postDocuments(
          firstHundredBrands
        );

        const [brandRunner, updatedResult, ...rest] = parseResponse(
          postedBrands,
          firstHundredBrands
        );

        log(chalk.magenta(brandRunner));
        log(chalk.green(updatedResult));

        for (const remaining of rest) {
          log(chalk.yellow(remaining));
        }
      } else {
        const { data: postedBrands = [] } = await postDocuments(
          formattedBrands
        );

        const [brandRunner, updatedResult, ...rest] = parseResponse(
          postedBrands,
          formattedBrands
        );

        log(chalk.magenta(brandRunner));
        log(chalk.green(updatedResult));

        for (const remaining of rest) {
          log(chalk.yellow(remaining));
        }

        formattedBrands.length = 0;
      }
    }

    timeEnd(functionLabel);
  }

  /**
   *
   * Fetch products from BigC, one page at a time.
   * Label brand and categories and push resulting docs back up to elasticsearch
   *
   **/

  log(chalk.magenta('Fetching product pages'));

  functionLabel = 'Fetched product pages';

  let totalPages = 0;
  const iterator = fetchProducts();

  for await (const page of iterator) {
    totalPages++;

    log(chalk.blue(`Page: ${totalPages}`));

    const [toUpdate, toDelete] = partitionAndFormatProducts(
      page,
      categoryResponse,
      brandKey
    );

    let localLabel = 'Deleted hidden products';
    log(chalk.magenta('Deleting hidden products...'));

    time(localLabel);

    const { data: deleteProductsResponse = [] } = await deleteDocuments(
      formatForDeletion(toDelete)
    );

    const [deletedRunner, deletedResult, ...deletedRest] = parseResponse(
      deleteProductsResponse,
      toDelete
    );

    log(chalk.magenta(deletedRunner));
    log(chalk.green(deletedResult));

    for (const unDeleted of deletedRest) {
      log(chalk.yellow(unDeleted));
    }

    timeEnd(localLabel);

    localLabel = 'Updated products';
    log(chalk.magenta('Updating products'));

    time(localLabel);

    const { data: postedDocuments = [] } = await postDocuments(toUpdate);

    const [updatedRunner, updatedResult, ...updatedRest] = parseResponse(
      postedDocuments,
      toUpdate
    );

    log(chalk.magenta(updatedRunner));
    log(chalk.green(updatedResult));

    for (const remaining of updatedRest) {
      log(chalk.yellow(remaining));
    }

    timeEnd(localLabel);
  }

  /**
   *
   * Cleanup
   *
   **/

  log(chalk.blue('Finished'));
  timeEnd(processLabel);
  process.exit(0);
}

/**
 *
 * Inquirer .env setup for --init
 *
 **/

function formatEnv(answers) {
  const env = ['# BIG C VARIABLES'];
  env.push(`BIGC_STORE_HASH=${answers.storeHash}`);
  env.push(`BIGC_AUTH_TOKEN=${answers.bigCAuth}`);
  env.push('# ELASTIC SEARCH VARIABLES');
  env.push(`ELASTIC_ENDPOINT=${answers.elasticEndPoint}`);
  env.push(`ELASTIC_ENGINE=${answers.elasticEngine}`);
  env.push(`ELASTIC_BEARER_TOKEN=${answers.elasticToken}`);
  return env.join('\n');
}

/**
 *
 * check for .env and begin init if keys are missing
 *
 **/

if (INIT) {
  const environmentQuestions = [
    {
      type: 'input',
      name: 'storeHash',
      message: 'What is your BigCommerce store hash? (ie: 10lp3d)',
      validate: (answer) => {
        if (answer.length !== 6) {
          log('\nThat does not look right');
          return false;
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'bigCAuth',
      message:
        'What is your BigCommerce API auth token? (31 alphanumeric chars)',
      validate: (answer) => {
        if (!answer.length) {
          log('\nThat does not look right');
          return false;
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'elasticEndPoint',
      message:
        'What is the endpoint of your elasticsearch db? (ie: https://' +
        'foo.com)',
      validate: (answer) => {
        const re = /^https?:\/\/.*/;
        if (!answer.match(re)) {
          log('\nThat does not look right');
          return false;
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'elasticEngine',
      message:
        'What is the name of your elasticsearch engine? (ie: ' +
        'foo-search-engine)',
      validate: (answer) => {
        if (!answer.length) {
          log('\nThat does not look right');
          return false;
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'elasticToken',
      message: 'Please provide your elasticsearch bearer token',
      validate: (answer) => {
        if (!answer.length) {
          log('\nThat does not look right');
          return false;
        }
        return true;
      },
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: (answers) => {
        log('ENV variables:\n');
        log(formatEnv(answers));
        log('\nWrite ENV variabled to .env?');
      },
    },
  ];

  ui.log.write('bigc2elastic init: setting environmental variables');

  inquirer
    .prompt(environmentQuestions)
    .then((answers) => {
      if (!answers.confirm) {
        log('Discarding ENV variables.');
        return;
      }
      const env = formatEnv(answers);
      fs.writeFile('./.env', env, (err) => {
        if (err) {
          log('Problems writing to filesystem...');
          console.error(err);
          return;
        }
        log('ENV created!');
      });
    })
    .catch((error) => {
      if (error.isTtyError) {
        // Prompt can't be rendered in the current environment
        log('This terminal is not playing nice');
      } else {
        log(error);
      }
    });
} else {
  try {
    run();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
