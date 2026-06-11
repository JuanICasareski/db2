import { InfluxDB, type WriteApi } from "@influxdata/influxdb-client";
import { config } from "../config";

let writeApi: WriteApi | undefined;

export function influxWrite(): WriteApi {
  if (!writeApi) {
    const influx = new InfluxDB({ url: config.influx.url, token: config.influx.token });
    writeApi = influx.getWriteApi(config.influx.org, config.influx.bucket, "ms");
  }
  return writeApi;
}
