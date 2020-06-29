const debug = require("debug")("queryDevices");
const TuyAPI = require("tuyapi");
const loadCloudDevices = require("./tuya");
const yaml = require("js-yaml");
const fs = require("fs").promises;
const Timeout = require("await-timeout");

async function queryDevices() {
  let fileContents = null;
  try {
    fileContents = await fs.readFile("./config.yml", "utf8");
  } catch (e) {
    console.error(
      "queryDevices.js error loading config.yml. You need to create a config.yml first.",
      e
    );
    process.exit(1);
  }
  try {
    let cloudDevices = await loadCloudDevices();
    let config = yaml.safeLoad(fileContents);
    let queriedDevices = [];
    for (let i in config.devices) {
      let dev = config.devices[i];
      if (!("key" in dev)) {
        dev.key = "0123456789abcdef";
      }
      try {
        const device = new TuyAPI(dev);
        device.on("error", (error) => {
          //can catch now
          //console.error(
          //  `queryDevice.js Error Message from device from TuyAPI ${error}`
          //);
        });

        await device.connect();

        let status = await device.get({ schema: true });
        if (typeof status == "string") {
          //string means error otherwise we would get an object
          device.disconnect();
          continue;
        }
        let mon = {};
        if (dev.version != "3.3") {
          mon.state = status.dps["1"];
          mon.W = status.dps["5"] / 10.0;
          mon.mA = status.dps["4"];
          mon.V = status.dps["6"] / 10.0;
        } else {
          mon.state = status.dps["1"];
          mon.W = status.dps["19"] / 10.0;
          mon.mA = status.dps["18"];
          mon.V = status.dps["20"] / 10.0;
        }

        dev.status = mon;
        dev.name = i;
        //see if we can load some names from the cloud
        if (cloudDevices) {
          let obj = cloudDevices.find((obj) => obj.id == dev.id);
          if (obj && "name" in obj) {
            dev.name = obj.name; //overwrite name with cloud name
          }
        }
        debug("Current monitoring values:", dev);
        queriedDevices.push(dev);

        device.disconnect();
      } catch (e) {
        console.error("queryDevices.js device loop Error catched", e);
      }
    }
    return queriedDevices;
  } catch (e) {
    console.error("queryDevices.js catched error", e);
    return;
  }
}
module.exports = queryDevices;
