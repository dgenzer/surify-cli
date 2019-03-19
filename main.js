#!/usr/bin/env node
'use strict';

const meow = require("meow");
const surify = require("./surify.js");
const fs = require("fs");
const parse = require("csv-parse");

const main = async () => {
  try {
    let config = JSON.parse(fs.readFileSync(cli.flags.config));
    surify.setConfig(config);
  } catch (e) {
    if (e.path == "config.json") {
      console.error(`
No configuration file! 

Set with flag -c [file] 
           or --config [file]
      `);
    }
  }

  let vars = [];
  if (cli.flags.json) {
    try {
      vars = JSON.parse(fs.readFileSync(cli.flags.json));
    } catch (e) {
      console.error(`
File ${cli.flags.json} is not a valid JSON.
      `);
    }
  } else if (cli.flags.csv) {
    parse(
      fs.readFileSync(cli.flags.csv),
      { delimiter: cli.flags.delimiter },
      (err, data) => {
        let header = data[0];
        data = data.splice(1);
        for (let entry in data) {
          let varsEntry = {};
          for (let col in data[entry]) {
            varsEntry[header[col]] = data[entry][col];
          }
          vars.push(varsEntry);
        }
      }
    );
  } else {
    vars = cli.flags;
  }

  let rules = await surify.readTemplate("suricata");
  let newRules = surify.setVars(rules, vars, cli.flags.sid);


  if (cli.flags.output.toLowerCase() === "log") {
    console.log(newRules.rules.join("\n"));
  } else {
    surify.writeRules(newRules, cli.flags.output);
  }
};

const cli = meow(`usage: 
$ surify -c config.json [FLAGS]

FLAGS
=====
-v, --version           show package version
-c, --config [file]     set config file
-o, --output [file]     set output file
             log        write to stdout
--json [file]           parse JSON-file
--csv [file]            parse CSV-file
    -d, --delimiter     delimiter in CSV-file
--sid [number]          set the first SID for the generated ruleset


EXAMPLES
=========
$ surify -c config.json --test1 1.2.3.4 --test2 9.9.9.9 --sid 120000 -o log
Set all test1 to "1.2.3.4" and test2 to "9.9.9.9" and start ruleset with sid 120000 and print them to stdout.

$ surify -c config.json --json example.json -o suri.rules

$ surify c config.json --csv example.csv -d ";" -o suri_csv.rules --sid 1

`, {
  flags: {
    version: {
      alias: "v",
      type: "boolean"
    },
    config: {
      alias: "c",
      type: "string",
      default: "config.json"
    },
    output: {
      alias: "o",
      type: "string",
      default: "suricata.rules"
    },
    json: {
      type: "string"
    },
    csv: {
      type: "string"
    },
    delimiter: {
      alias: "d",
      type: "string"
    },
    sid: {
      type: "string"
    }
  }
});

main();
