import { type Tenant } from "@flowops/types";
import { mongo } from "../db/mongo";

const col = () => mongo().collection<Tenant>("tenants");

export const tenantsRepo = {
  // Todos los tenants, ordenados por id para el desplegable del front.
  async list(): Promise<Tenant[]> {
    return col().find({}, { projection: { _id: 0 } }).sort({ tenant_id: 1 }).toArray();
  },
};
