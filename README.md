# bigc2elastic

A lightweight CLI utility designed to pull product and category data from
BigCommerce stores and push that data back up to an elasticsearch instance.

# What it does

Running this utility will:

- Query BigCommerce for categories
- Check returned categories for `is_visible`
- Attempt to delete any hidden categories from elasticsearch (if they exist)
- POST the remaining categories to elasticsearch, updating them if changed
- Query BigCommerce for products
- Check returned products for `is_visible`
- Attempt to delete any hidden products from elasticsearch (if they exist)
- POST the remaining products to elasticsearch, updating them if changed
- Output all steps and process colorfully to the terminal

# CLI Flags

Optional flags include:

| Flag | Example |
| ---- | ------- |
| drop | `node ./lib/index.js --drop` |
| products-only | `node ./lib/index.js --products-only` |
| no-categories | `node ./lib/index.js --no-categories` |
| no-brands | `node ./lib/index.js --no-brands` |

- `--products-only` (ie: `bigc2elastic --products-only`)
- `--drop` (ie: `bigc2elastic --drop`)

Running the CLI with the `--products-only` flag still queries BigCommerce for
categories to decorate products with their cateogry names, but it will not drop
or update categories within elasticsearch.

Running the CLI with the `--drop` flag will drop all existing documents from
elasticsearch before beginning the updates (effectively starting clean).

## Setup

1. First install nvm with `curl
   https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash`
   on Debian-based systems, update your environment settings with `source
   ~/.profile`, and install node with `nvm install latest` (alternatively,
   check out https://nodejs.org/en/download/ for other installation options).
2. Pull the repository down to your local machine by cloning the repository.
  - By [installing git](https://github.com/git-guides/install-git) and running:
    `cd /opt/ && git clone https://github.com/iangoodnight/bigc2elastic.git`
  - Or using cUrl with:
    `curl -L https://github.com/iangoodnight/bigc2elastic/archive/master.zip > \
    bigc2elastic.tar.gz && tar -zxvf bigc2elastic.tar.gz`
3. Install dependencies with `cd bigc2elastic/ && npm install` for the entire
   package, or with `cd bigc2elastic/ && npm install --production` to install
   the package without development dependencies.
4. Set your secret keys using `.env.example` and filling in the missing values.
5. Rename `.env.example` with `mv .env.example .env`.
6. If you have installed the entire package (with devDependencies) you can test
   your installation with `npm test`.
7. If everything looks right, you can run the application with `npm start`.

## Creating a cronjob

1. Grant the 'execute' permission to the root of bigc2elastic:
  `sudo chmod +x /opt/bigc2elastic/lib/index.js`
2. Setup your crontab with the command:
  `crontab -e`
3. Crontab uses the syntax `m h dom mon dow command` referring to `minute`,
   `hour`, `day of month`, `month`, and `day of week` respectively with `*`
   actiing as a wildcard for 'any'.  Occasionally, the relative paths called
   from node programs don't play nice with cronjobs, so we are going to start
   our <command> by changing directories to the root of bigc2elastic.  So, if we
   wanted to run our script once a week our crontab entry might look like:
   `0 5 * * 1 cd /opt/bigc2elastic/lib/ && ./index.js`

By default, the output from cronjobs goes to `/var/mail/`, but
you can override this by redirecting the output as part of the command. So the
crontab entry:
`0 5 * * 1 cd /opt/bigc2elastic/lib/ && ./index.js > ../run.log`
Runs the program and saves the output from that last job to the file
`/opt/bigc2elastic/run.log` for review.
