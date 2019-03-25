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

let recentSID;
const getSID = () => {
  return recentSID;
}

const setSID = (sid) => {
  recentSID = sid;
}

const getTemplates = () => {
  return config.template;
}

const readTemplate = async template => {
  let templatePath = path.join(getDir(), config.template[template].path);

  let buffer = await fs.readFileSync(templatePath);
  let templates = Buffer.from(buffer).toString();
  let rules = templates.split("\n");

  let conditions = config.template[template].conditions || false;

  return {
    rules,
    template,
    conditions
  };
};

const setVars = (rules, varArray, sid) => {
  if (Number.isSafeInteger(+sid)) {
    recentSID = +sid;
  } else if (sid) {
    recentSID = 1;
  }
  let replacedRules = { rules: [], template: rules.template };
  if (!Array.isArray(varArray)) varArray = [varArray];

  for (let vars of varArray) {
    if(rules.conditions && JSON.stringify(rules.conditions).length > 0) {
      let allConditionsTrue = 0;
      for(let condition of Object.entries(rules.conditions)) {
        if(vars[condition[0]] == condition[1]) {
          allConditionsTrue++;
        } 
      }
      if(Object.keys(rules.conditions).length !== allConditionsTrue) {
        continue;
      } 
    }
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
          rule = rule.replace(/sid:\ ?\d+;?/, `sid: ${recentSID};`);
        } else {
             let lastIx = rule.lastIndexOf(")");
             let appendSemicolon = !rule.slice(0, lastIx).endsWith(";");
             let newRule = `${rule.slice(0, lastIx)}${appendSemicolon ? ";" : ""} sid: ${recentSID};${rule.slice(lastIx)}`
             rule = newRule;
        }
      }
      replacedRules.rules.push(rule);
      if(sid) {
        recentSID++;
      }
    }
  }
  return replacedRules;
};

const writeRules = (rules, filename) => {
  let data = rules
  .map(entry => entry.rules.join("\n"))
  .join("\n");
  if (filename) {
    fs.writeFileSync(filename, data);
    return `✅ File ${filename} written.`;
  } else {
    return data;
  }
};

module.exports = {
  getSID,
  setSID,
  setConfig,
  setVars,
  getTemplates,
  readTemplate,
  writeRules
};