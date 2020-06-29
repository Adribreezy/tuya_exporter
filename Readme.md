# node-tuya-exporter

Prometheus exporter for tuya products.

## Overview

The project is based on https://github.com/codetheweb/tuyapi (although some patches had to be applied https://github.com/dotmaster/tuyapi/tree/patch-1) which are not merged yet) for LAN based info about devices,
https://github.com/unparagoned/cloudtuya
for Cloud based device names
and
https://github.com/siimon/prom-client
for exporting metrics format to prometheus as well as an express server

## Installation

```Shell
npm install node-tuya-exporter
```

## Config

can be found in config.yml.
Here you have to configure the local tuya devices to get metrics from.
Format is:

```YAML
devices:
  tuya-strom-1-ubuntu:
    id: "020517122462ab206e70"
    ip: "192.168.1.54"
    key: "3af2a997778ce879" #if using newer firmware you need a localkey
    version: "3.3"
  wifi-strom-1:
    id: "07202524dc4f223ae2c5"
    ip: "192.168.1.48"
```

Links about how you can get the localkey you can find here:

https://github.com/clach04/python-tuya/wiki. For me the only way that worked was using rooted Android and installing an older version of Smart Life (I think 3.6.1) as its the last version that exposes localkey in the xml file.

In addition the device names can be taken directly from Tuya Cloud by passing in a keys.yaml. This part is Optional, otherwise the keys from config.yml will be taken as device names.
The format is:

```JSON
{
  "userName": "YOURSMARTLIFEEMAIL",
  "password": "YOURSMARTLIFEPASSWORD",
  "bizType": "smart_life",
  "countryCode": "44",
  "region": "eu"
}
```

There is a caching mechanism, which saves the names to a local file called devices.json just in case the cloud is not reachable for some time.

## Usage

```
npm start [port]
```

`port` defaults to 9498.

Visit http://localhost:9498/metrics

## Prometheus Configuration

The tuya exporter needs to be configured in prometheus.yml.

Example config:

```YAML
  - job_name: 'tuya-exporter'
    scrape_interval: 1m
    static_configs:
      - targets:
        # IP of the exporter
        - tuya-exporter:9498
```

## To run in docker

Create a docker-compose.yml

```YAML
tuya-exporter:
    build:
      context: ../node-tuya-exporter
    container_name: tuya-exporter
    restart: always
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /etc/timezone:/etc/timezone:ro
      - ./node-tuya-exporter/config.yml:/usr/src/app/config.yml:ro
      - ./node-tuya-exporter/keys.json:/usr/src/app/keys.json:ro
    ports:
      - 9011:9498
```

or use an existing image:

```YAML
tuya-exporter:
    image: dotmaster/node-tuya-exporter
    container_name: tuya-exporter
    restart: always
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /etc/timezone:/etc/timezone:ro
      - ./node-tuya-exporter/config.yml:/usr/src/app/config.yml:ro
      - ./node-tuya-exporter/keys.json:/usr/src/app/keys.json:ro
    ports:
      - 9011:9498
```

```BASH
docker-compose up -d tuya-exporter
docker-compose logs -f tuya-exporter
```
