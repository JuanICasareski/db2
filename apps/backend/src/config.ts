const env = (key: string, fallback: string) => process.env[key] ?? fallback;

export const config = {
  port: Number(env("PORT", "3000")),
  // directConnection: el replica set anuncia hostnames internos de Docker;
  // se habla solo con el nodo expuesto y listo.
  mongoUrl: env("MONGO_URL", "mongodb://localhost:27017/?directConnection=true"),
  mongoDb: env("MONGO_DB", "flowops"),
  redisUrl: env("REDIS_URL", "redis://localhost:6379"),
  // Lista host:puerto separada por comas. Si esta seteada, el backend
  // habla con el Redis Cluster del profile full-size.
  redisClusterNodes: env("REDIS_CLUSTER_NODES", "").split(",").filter(Boolean),
  cassandra: {
    contactPoints: env("CASSANDRA_CONTACT_POINTS", "localhost:9042").split(","),
    localDataCenter: env("CASSANDRA_DC", "datacenter1"),
    keyspace: env("CASSANDRA_KEYSPACE", "flowops"),
    // 1 en el profile liviano, 3 en el cluster.
    replicationFactor: Number(env("CASSANDRA_RF", "1")),
  },
  influx: {
    url: env("INFLUX_URL", "http://localhost:8086"),
    token: env("INFLUX_TOKEN", "dev-token"),
    org: env("INFLUX_ORG", "flowops"),
    bucket: env("INFLUX_BUCKET", "flowops"),
  },
};
