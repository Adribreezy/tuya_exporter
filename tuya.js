const debug = require("debug")("cloudtuya");
const fs = require("fs").promises;
const CloudTuya = require("cloudtuya");

/**
 * Load Device Data  Devices to file
 * @param {String} [file="./devices.json"] to save to
 */
async function loadDataFromFile(file = "./devices.json") {
  try {
    return require("./devices.json");
  } catch (err) {
    console.warn("cloudtuya devices.json is missing. creating temporary");
    return;
  }
}

/**
 * Save Data Such a Devices to file
 * @param {Object} data to save
 * @param {String} [file="./devices.json"] to save to
 */
async function saveDataToFile(data, file = "./devices.json") {
  debug(`Data ${JSON.stringify(data)}`);
  try {
    await fs.writeFile(file, JSON.stringify(data));
    debug(`The file ${file} was saved!`);
    return file;
  } catch (err) {
    return debug("cloudtuya Error saving file", err);
  }
}

async function main() {
  // Load local files
  let apiKeys = {};
  try {
    apiKeys = require("./keys.json");
  } catch (err) {
    console.error(
      "cloudtuya keys.json is missing. You need a keys.json to load names from cloud. Will not load names from cloud."
    );
    return;
  }

  // Load from keys.json
  const api = new CloudTuya({
    userName: apiKeys.userName,
    password: apiKeys.password,
    bizType: apiKeys.bizType,
    countryCode: apiKeys.countryCode,
    region: apiKeys.region,
  });
  try {
    // Connect to cloud api and get access token.
    const tokens = await api.login();
    debug(`Token ${JSON.stringify(tokens)}`);
  } catch (err) {
    console.error(
      "cloudtuya Cannot connect to cloud. Will not load data from cloud. Do you have internet?",
      err
    );
    return;
  }
  let devices = null;
  try {
    // Get all devices registered on the Tuya app
    devices = await api.find();
  } catch (err) {
    console.error("cloudtuya Error finding device ", err);
    return;
  }

  if (devices) {
    // Cache device to device.json
    try {
      await saveDataToFile(devices);
    } catch (err) {
      console.error("cloudtuya Error saving cloud data to cache", err);
      return;
    }
  } else {
    try {
      devices = await loadDataFromFile();
    } catch (err) {
      console.error("cloudtuya Error loading data from file", err);
      return;
    }
  }

  //if we are her we have devices
  return devices;
}

module.exports = main;
