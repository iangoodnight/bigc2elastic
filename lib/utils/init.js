/**
 *
 * /utils/
 *
 * init.js
 *
 **/

'use strict';

const fs = require('fs');

const inquirer = require('inquirer');

const ui = new inquirer.ui.BottomBar();

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

const environmentQuestions = [
  {
    type: 'input',
    name: 'storeHash',
    message: 'What is your BigCommerce store hash? (ie: 10lp3d)',
    validate: (answer) => {
      if (answer.length !== 6) {
        console.log('\nThat does not look right');
        return false;
      }
      return true;
    },
  },
  {
    type: 'input',
    name: 'bigCAuth',
    message: 'What is your BigCommerce API auth token? (31 alphanumeric chars)',
    validate: (answer) => {
      if (!answer.length) {
        console.log('\nThat does not look right');
        return false;
      }
      return true;
    },
  },
  {
    type: 'input',
    name: 'elasticEndPoint',
    message:
      'What is the endpoint of your elasticsearch db? (ie: https://foo' +
      '.com)',
    validate: (answer) => {
      const re = /^https?:\/\/.*/;
      if (!answer.match(re)) {
        console.log('\nThat does not look right');
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
        console.log('\nThat does not look right');
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
        console.log('\nThat does not look right');
        return false;
      }
      return true;
    },
  },
  {
    type: 'confirm',
    name: 'confirm',
    message: (answers) => {
      console.log('ENV variables:\n');
      console.log(formatEnv(answers));
      console.log('\nWrite ENV variabled to .env?');
    },
  },
];

ui.log.write('bigc2elastic init: setting environmental variables');

inquirer
  .prompt(environmentQuestions)
  .then((answers) => {
    if (!answers.confirm) {
      console.log('Discarding ENV variables.');
      return;
    }
    const env = formatEnv(answers);
    fs.writeFile('../../.env', env, (err) => {
      if (err) {
        console.log('Problems writing to filesystem...');
        console.error(err);
        return;
      }
      console.log('ENV created!');
    });
  })
  .catch((error) => {
    if (error.isTtyError) {
      // Prompt can't be rendered in the current environment
      console.log('This terminal is not playing nice');
    } else {
      console.log(error);
    }
  });
