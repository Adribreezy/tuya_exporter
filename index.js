require("log-timestamp");
const express = require("express");
const server = express();
const client = require("prom-client");
const Registry = client.Registry;
const registry = new client.Registry();
// const collectDefaultMetrics = client.collectDefaultMetrics;
// const prefix = "tuya_";
// collectDefaultMetrics({ prefix: prefix, register: registry });

//register some metrics
let WG = new client.Gauge({
  name: "Watt",
  help: "Watt Measurement",
  labelNames: ["DeviceName", "state"],
  registers: [registry],
});
let VG = new client.Gauge({
  name: "Voltage",
  help: "Voltage Measurement",
  labelNames: ["DeviceName", "state"],
  registers: [registry],
});
let mAG = new client.Gauge({
  name: "Milliamperes",
  help: "Milli Amperes Measurement",
  labelNames: ["DeviceName", "state"],
  registers: [registry],
});

let stateG = new client.Gauge({
  name: "State",
  help: "State of Device",
  labelNames: ["DeviceName"],
  registers: [registry],
});

async function updateMetrics() {
  const queryDevices = require("./queryDevices");

  const queriedDevices = await queryDevices();

  if (queriedDevices) {
    for (let i in queriedDevices) {
      let dev = queriedDevices[i];
      WG.set({ DeviceName: dev.name, state: dev.status.state }, dev.status.W);
      VG.set({ DeviceName: dev.name, state: dev.status.state }, dev.status.V);
      mAG.set({ DeviceName: dev.name, state: dev.status.state }, dev.status.mA);
      stateG.set({ DeviceName: dev.name }, dev.status.state ? 1 : 0);
    }
  }
  return queriedDevices;
}

async function main() {
  server.get("/metrics", async (req, res) => {
    try {
      let qd = await updateMetrics();
      if (qd) {
        res.set("Content-Type", registry.contentType);
        console.log("Served Register Metrics ", registry.metrics().length);
        res.end(registry.metrics());
        registry.resetMetrics();
      } else {
      }
    } catch (err) {
      console.error("index.js Error catched", err);
      res.status(400).send();
    }
  });
  const port = process.env.PORT || 9498;
  console.log(
    `Server listening to ${port}, metrics exposed on /metrics endpoint`
  );
  server.listen(port);
}
process.on("uncaughtException", function (err) {
  console.error("index.js handled uncaght exception", err);
  console.log("Node NOT Exiting...");
});
main();
