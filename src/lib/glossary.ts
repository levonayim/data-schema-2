import type { EntityNode, SchemaFile } from "../types";

export interface SchemaEntityRef {
  schemaId: string;
  schemaName: string;
  entityId: string;
  entityName: string;
  kind: EntityNode["kind"];
  color: string;
}

/**
 * A schema's entity list, preferring the live in-memory list for the active schema
 * (which may have unsaved edits) over its last-saved snapshot in `schemas`.
 */
export function entitiesForSchema(schema: SchemaFile, activeSchemaId: string, liveEntities: EntityNode[]): EntityNode[] {
  return schema.id === activeSchemaId ? liveEntities : schema.entities;
}

export function allSchemaEntities(schemas: SchemaFile[], activeSchemaId: string, liveEntities: EntityNode[]): SchemaEntityRef[] {
  const out: SchemaEntityRef[] = [];
  schemas.forEach((schema) => {
    entitiesForSchema(schema, activeSchemaId, liveEntities).forEach((e) => {
      out.push({ schemaId: schema.id, schemaName: schema.name, entityId: e.id, entityName: e.name, kind: e.kind, color: e.color });
    });
  });
  return out;
}

export function resolveSchemaEntity(
  schemas: SchemaFile[],
  activeSchemaId: string,
  liveEntities: EntityNode[],
  schemaId: string,
  entityId: string
): SchemaEntityRef | null {
  return allSchemaEntities(schemas, activeSchemaId, liveEntities).find((r) => r.schemaId === schemaId && r.entityId === entityId) ?? null;
}

/** every entity, in any schema, whose canonicalTermRef points at (targetSchemaId, targetEntityId) */
export function computeRestatements(
  schemas: SchemaFile[],
  activeSchemaId: string,
  liveEntities: EntityNode[],
  targetSchemaId: string,
  targetEntityId: string
): SchemaEntityRef[] {
  const out: SchemaEntityRef[] = [];
  schemas.forEach((schema) => {
    entitiesForSchema(schema, activeSchemaId, liveEntities).forEach((e) => {
      if (e.canonicalTermRef?.schemaId === targetSchemaId && e.canonicalTermRef.entityId === targetEntityId) {
        out.push({ schemaId: schema.id, schemaName: schema.name, entityId: e.id, entityName: e.name, kind: e.kind, color: e.color });
      }
    });
  });
  return out;
}
