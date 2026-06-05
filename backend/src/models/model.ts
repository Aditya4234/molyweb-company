import bcrypt from "bcryptjs";
import db from "../db";

type FilterValue = any;

type QueryType = "find" | "findOne" | "findById";

function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseFilter(filter: any): any {
  if (!filter || typeof filter !== "object" || Array.isArray(filter)) {
    return filter;
  }

  const where: Record<string, unknown> = {};

  for (const key of Object.keys(filter)) {
    const value = filter[key];
    if (key === "$or" && Array.isArray(value)) {
      where.OR = value.map(parseFilter);
    } else if (key === "$and" && Array.isArray(value)) {
      where.AND = value.map(parseFilter);
    } else if (key === "$not") {
      where.NOT = parseFilter(value);
    } else if (isObject(value) && !isRegExp(value)) {
      const nestedKeys = Object.keys(value);
      const condition: Record<string, any> = {};
      if (nestedKeys.includes("$gt")) {
        condition.gt = value.$gt;
      }
      if (nestedKeys.includes("$gte")) {
        condition.gte = value.$gte;
      }
      if (nestedKeys.includes("$lt")) {
        condition.lt = value.$lt;
      }
      if (nestedKeys.includes("$lte")) {
        condition.lte = value.$lte;
      }
      if (nestedKeys.includes("$in")) {
        condition.in = value.$in;
      }
      if (nestedKeys.includes("$nin")) {
        condition.notIn = value.$nin;
      }
      if (nestedKeys.includes("$regex")) {
        const regex = value.$regex;
        if (isRegExp(regex)) {
          condition.contains = regex.source;
          condition.mode = "insensitive";
        } else if (typeof regex === "string") {
          condition.contains = regex;
          condition.mode = "insensitive";
        }
      }
      if (Object.keys(condition).length > 0) {
        where[key] = condition;
      } else {
        where[key] = parseFilter(value);
      }
    } else if (isRegExp(value)) {
      where[key] = { contains: value.source, mode: "insensitive" };
    } else {
      where[key] = value;
    }
  }

  return where;
}

function parseSort(sort: any): any {
  if (!sort || typeof sort !== "object") return undefined;
  const orderBy: Record<string, "asc" | "desc">[] = [];
  for (const key of Object.keys(sort)) {
    orderBy.push({ [key]: sort[key] === -1 ? "desc" : "asc" });
  }
  return orderBy.length === 1 ? orderBy[0] : orderBy;
}

function parseSelect(selection: any): Set<string> {
  const excluded = new Set<string>();
  if (typeof selection === "string") {
    for (const part of selection.split(/\s+/)) {
      if (part.startsWith("-")) {
        excluded.add(part.slice(1));
      }
    }
  } else if (Array.isArray(selection)) {
    for (const key of selection) {
      if (typeof key === "string") excluded.add(key);
    }
  } else if (isObject(selection)) {
    for (const [key, value] of Object.entries(selection)) {
      if (!value) excluded.add(key);
    }
  }
  return excluded;
}

function applySelection(record: any, exclude?: Set<string>) {
  if (!exclude || exclude.size === 0) return record;
  if (Array.isArray(record)) {
    return record.map((item) => applySelection(item, exclude));
  }
  const result: any = {};
  for (const key of Object.keys(record)) {
    if (!exclude.has(key)) {
      result[key] = record[key];
    }
  }
  return result;
}

function isHashedPassword(value: unknown): boolean {
  return typeof value === "string" && value.startsWith("$2") && value.length >= 60;
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

function cloneData(data: any): any {
  const result: any = {};
  for (const key of Object.keys(data)) {
    if (typeof data[key] !== "function" && key !== "_id") {
      result[key] = data[key];
    }
  }
  return result;
}

function buildDocument(modelName: string, record: any): any {
  if (!record) return null;
  const doc: any = { ...record, id: String(record.id), _id: String(record.id) };

  if (modelName === "user") {
    doc.comparePassword = async (candidatePassword: string) => {
      if (!doc.password) return false;
      return bcrypt.compare(candidatePassword, doc.password);
    };
  }

  doc.save = async function () {
    const data = cloneData(this);
    if (modelName === "user" && data.password && !isHashedPassword(data.password)) {
      data.password = await hashPassword(data.password);
    }
    const updated = await (db as any)[modelName].update({
      where: { id: this.id },
      data,
    });
    return buildDocument(modelName, updated);
  };

  return doc;
}

class PrismaQuery<T> implements Promise<T> {
  private orderBy: any;
  private skipCount?: number;
  private takeCount?: number;
  private excludeFields?: Set<string>;

  constructor(private modelName: string, private type: QueryType, private filter: any) {}

  sort(order: any) {
    this.orderBy = parseSort(order);
    return this;
  }

  skip(value: number) {
    this.skipCount = value;
    return this;
  }

  limit(value: number) {
    this.takeCount = value;
    return this;
  }

  lean() {
    return this;
  }

  select(selection: any) {
    this.excludeFields = parseSelect(selection);
    return this;
  }

  async execute(): Promise<any> {
    const model = (db as any)[this.modelName];
    if (!model) throw new Error(`Prisma model not found: ${this.modelName}`);

    const query: any = {};
    const where = this.type === "findById" ? { id: String(this.filter) } : parseFilter(this.filter);
    if (where && Object.keys(where).length > 0) {
      query.where = where;
    }
    if (this.orderBy) query.orderBy = this.orderBy;
    if (typeof this.skipCount === "number") query.skip = this.skipCount;
    if (typeof this.takeCount === "number") query.take = this.takeCount;

    let result: any;
    if (this.type === "find") {
      result = await model.findMany(query);
      result = result.map((item: any) => buildDocument(this.modelName, item));
    } else if (this.type === "findOne") {
      result = await model.findFirst(query);
      result = buildDocument(this.modelName, result);
    } else {
      result = await model.findUnique(query);
      result = buildDocument(this.modelName, result);
    }

    if (this.excludeFields) {
      result = applySelection(result, this.excludeFields);
    }
    return result;
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as any, onrejected as any);
  }

  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult> {
    return this.execute().catch(onrejected as any);
  }

  finally(onfinally?: (() => void) | undefined | null): Promise<T> {
    return this.execute().finally(onfinally as any);
  }
}

function createModel(modelName: string) {
  // Convert PascalCase to camelCase: "User" -> "user", "LoginAudit" -> "loginAudit"
  const camelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  return {
    find(filter: any = {}) {
      return new PrismaQuery(camelName, "find", filter);
    },
    findOne(filter: any = {}) {
      return new PrismaQuery(camelName, "findOne", filter);
    },
    findById(id: string) {
      return new PrismaQuery(camelName, "findById", id);
    },
    async countDocuments(filter: any = {}) {
      return (db as any)[camelName].count({ where: parseFilter(filter) });
    },
    async findByIdAndUpdate(id: string, data: any) {
      const update = cloneData(data);
      if (camelName === "user" && update.password && !isHashedPassword(update.password)) {
        update.password = await hashPassword(update.password);
      }
      const updated = await (db as any)[camelName].update({ where: { id }, data: update });
      return buildDocument(camelName, updated);
    },
    async findByIdAndDelete(id: string) {
      const deleted = await (db as any)[camelName].delete({ where: { id } });
      return buildDocument(camelName, deleted);
    },
    async create(data: any) {
      const createData = cloneData(data);
      if (camelName === "user" && createData.password && !isHashedPassword(createData.password)) {
        createData.password = await hashPassword(createData.password);
      }
      const created = await (db as any)[camelName].create({ data: createData });
      return buildDocument(camelName, created);
    },
  };
}

export default createModel;
