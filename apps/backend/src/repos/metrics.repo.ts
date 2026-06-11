import { Point } from "@influxdata/influxdb-client";
import { influxWrite } from "../db/influx";

export const metricsRepo = {
  async instanceStarted(tenantId: string, processId: string): Promise<void> {
    influxWrite().writePoint(
      new Point("instance_started")
        .tag("tenant_id", tenantId)
        .tag("process_id", processId)
        .intField("count", 1),
    );
    await influxWrite().flush();
  },

  // Un punto por avance: duracion del paso que se acaba de cerrar.
  async stepAdvanced(args: {
    tenantId: string;
    processId: string;
    node: string;
    durationMs: number;
  }): Promise<void> {
    influxWrite().writePoint(
      new Point("step_advance")
        .tag("tenant_id", args.tenantId)
        .tag("process_id", args.processId)
        .tag("node", args.node)
        .intField("duration_ms", args.durationMs)
        .intField("count", 1),
    );
    await influxWrite().flush();
  },
};
