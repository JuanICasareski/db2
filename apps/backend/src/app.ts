import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { createRouter } from "./lib/api";
import { processes } from "./routes/processes";
import { instances } from "./routes/instances";

export const app = createRouter();

// Abierto: entorno de desarrollo local, el front pega directo.
app.use("*", cors());

app.route("/processes", processes);
app.route("/instances", instances);

app.doc("/doc", {
  openapi: "3.0.3",
  info: {
    title: "FlowOps API",
    version: "0.1.0",
    description: "Prototipo BPM NoSQL. El tenant viaja en el header X-Tenant-Id.",
  },
});
app.get("/ui", swaggerUI({ url: "/doc" }));
app.get("/", (c) => c.redirect("/ui"));
