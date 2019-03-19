"use strict";
const fs = require("fs");
const path = require("path");

const getDir = () => {
  return path.dirname(`${process.mainModule.filename}`);
};

let config = require(path.join(getDir(), `config.json`));

const setConfig = sett => {
  config = sett;
};

const readTemplate = async template => {
  let templatePath = path.join(getDir(), config.template[template].path);

  let buffer = await fs.readFileSync(templatePath);
  let templates = Buffer.from(buffer).toString();
  let rules = templates.split("\n");

  return {
    rules,
    template
  };
};

const setVars = (rules, varArray, sid) => {
  if (Number.isSafeInteger(+sid)) {
    sid = +sid;
  } else if (sid) {
    sid = 1;
  }
  let replacedRules = { rules: [], template: rules.template };
  if (!Array.isArray(varArray)) varArray = [varArray];

  for (let vars of varArray) {
    for (let rule of rules.rules) {
      for (let variable in vars) {
        let regx = new RegExp(
          `${config.template[rules.template].startVar}${variable}${
            config.template[rules.template].endVar
          }`.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&"),
          "g"
        );
        for (let match in rule.match(regx)) {
          rule = rule.replace(regx, vars[variable]);
        }
      }
      if (sid) {
        let sidMatch = rule.match(/sid:\ ?\d+;?/);
        if (sidMatch) {
          rule = rule.replace(/sid:\ ?\d+;?/, `sid: ${sid};`);
        } else {
             let lastIx = rule.lastIndexOf(")");
             let appendSemicolon = !rule.slice(0, lastIx).endsWith(";");
             let newRule = `${rule.slice(0, lastIx)}${appendSemicolon ? ";" : ""} sid: ${sid};${rule.slice(lastIx)}`
             rule = newRule;
        }
      }
      replacedRules.rules.push(rule);
      sid++;
    }
  }
  return replacedRules;
};

const writeRules = (rules, filename) => {
  if (filename) {
    fs.writeFile(filename, rules.rules.join("\n"), err => {
      return err;
    });
    return `✅ File ${filename} written.`;
  } else {
    return rules.rules.join("\n");
  }
};

module.exports = {
  setConfig,
  setVars,
  readTemplate,
  writeRules
};
