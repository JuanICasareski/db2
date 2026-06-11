import type {
  Advance,
  Event,
  Instance,
  InstanceState,
  ProcessDefinition,
  StartInstance,
  Tenant,
} from "@flowops/types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function req<T>(tenant: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenant,
      ...init?.headers,
    },
  });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body as T;
}

export const api = {
  listTenants: () => req<Tenant[]>("", "/tenants"),
  listProcesses: (tenant: string) => req<ProcessDefinition[]>(tenant, "/processes"),
  getProcess: (tenant: string, processId: string, version?: number) =>
    req<ProcessDefinition>(
      tenant,
      `/processes/${processId}${version !== undefined ? `?version=${version}` : ""}`,
    ),
  createProcess: (tenant: string, def: unknown) =>
    req<ProcessDefinition>(tenant, "/processes", { method: "POST", body: JSON.stringify(def) }),
  listInstances: (tenant: string) => req<Instance[]>(tenant, "/instances"),
  startInstance: (tenant: string, body: StartInstance) =>
    req<Instance>(tenant, "/instances", { method: "POST", body: JSON.stringify(body) }),
  getInstance: (tenant: string, instanceId: string) =>
    req<Instance>(tenant, `/instances/${instanceId}`),
  getState: (tenant: string, instanceId: string) =>
    req<InstanceState>(tenant, `/instances/${instanceId}/state`),
  advance: (tenant: string, instanceId: string, body: Advance) =>
    req<Instance>(tenant, `/instances/${instanceId}/advance`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  listEvents: (tenant: string, instanceId: string) =>
    req<Event[]>(tenant, `/instances/${instanceId}/events`),
};
