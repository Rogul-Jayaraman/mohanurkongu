import { prisma } from '../../../database/prisma.js';
import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/ErrorCodes.js';
import type { MandapamPipelineContext, EntityType, EntityCrudAction, EntityCrudConfig } from './context.types.js';
import { ENTITY_CRUD_CONFIGS } from './context.types.js';
import { buildCatalogTag, MandapamCacheTtls } from '../cache/mandapam-cache-tags.js';
import { addCacheInvalidationTag } from './mandapam-flush-cache-invalidations.step.js';

export async function entityCrudWithTranslations(ctx: MandapamPipelineContext, entityType: EntityType, action: EntityCrudAction): Promise<MandapamPipelineContext> {
  const config = ENTITY_CRUD_CONFIGS[entityType];
  const input = ctx.input;
  const id = ctx.id;
  const tag = buildCatalogTag(entityType);

  if (action === 'LIST') {
    if (ctx.cacheManager) {
      const cached = await ctx.cacheManager.get(tag);
      if (cached) {
        ctx.responseData = { [`${entityType}s`]: cached };
        return ctx;
      }
    }
    const items = await (prisma as any)[config.tableName].findMany({
      include: { translations: true },
      orderBy: { createdAt: 'desc' },
    });
    ctx.responseData = { [`${entityType}s`]: items };
    if (ctx.cacheManager) {
      await ctx.cacheManager.setByTags([tag], items, { defaultTtl: MandapamCacheTtls.CATALOG });
    }
    return ctx;
  }

  if (action === 'PUBLIC_LIST') {
    const publicTag = `${tag}:public`;
    if (ctx.cacheManager) {
      const cached = await ctx.cacheManager.get(publicTag);
      if (cached) {
        ctx.responseData = { [`${entityType}s`]: cached };
        return ctx;
      }
    }
    const language = (input.language as string) || 'EN';
    const items = await (prisma as any)[config.tableName].findMany({
      where: { status: true },
      include: { translations: { where: { language: language as any } } },
      orderBy: { createdAt: 'desc' },
    });
    const mapped = items.map((item: any) => config.publicListTransform(item, language));
    ctx.responseData = {
      [`${entityType}s`]: mapped,
    };
    if (ctx.cacheManager) {
      await ctx.cacheManager.setByTags([publicTag], mapped, { defaultTtl: MandapamCacheTtls.CATALOG });
    }
    return ctx;
  }

  if (action === 'CREATE') {
    addCacheInvalidationTag(ctx, tag);
    addCacheInvalidationTag(ctx, `${tag}:public`);
    const tx = (ctx as any).tx || prisma;
    const table = (tx as any)[config.tableName];

    const createData: any = {};
    for (const field of config.extraFields) {
      if (input[field] !== undefined) createData[field] = input[field];
    }

    const entity = await table.create({ data: createData });

    if (input.name && Array.isArray(input.name)) {
      const translationTable = (tx as any)[config.translationTableName];
      for (const t of input.name) {
        await translationTable.create({
          data: { [config.fkField]: entity.id, language: t.language, name: t.value },
        });
      }
    }

    const result = await table.findUnique({
      where: { id: entity.id },
      include: { translations: true },
    });
    ctx.responseData = { [entityType]: result };
    return ctx;
  }

  if (action === 'UPDATE') {
    addCacheInvalidationTag(ctx, tag);
    addCacheInvalidationTag(ctx, `${tag}:public`);
    if (!id) throw new AppError(400, 'VALIDATION_ERROR', 'Entity ID is required');

    const existing = await (prisma as any)[config.tableName].findUnique({ where: { id } });
    if (!existing) {
      const notFoundKey = entityType === 'facility' ? ErrorCodes.MANDAPAM_FACILITY_NOT_FOUND : ErrorCodes.MANDAPAM_ADDON_NOT_FOUND;
      throw new AppError(404, notFoundKey, `${entityType} not found`);
    }

    return prisma.$transaction(async (tx) => {
      const updateData: any = {};
      for (const field of config.extraFields) {
        if (input[field] !== undefined) updateData[field] = input[field];
      }
      if (input.status !== undefined) updateData.status = input.status;

      const table = (tx as any)[config.tableName];
      if (Object.keys(updateData).length > 0) {
        await table.update({ where: { id }, data: updateData });
      }

      if (input.name && Array.isArray(input.name)) {
        const translationTable = (tx as any)[config.translationTableName];
        for (const t of input.name) {
          const where = { [`${config.fkField}_language`]: { [config.fkField]: id, language: t.language } };
          await translationTable.upsert({
            where,
            update: { name: t.value },
            create: { [config.fkField]: id, language: t.language, name: t.value },
          });
        }
      }

      const result = await table.findUnique({
        where: { id },
        include: { translations: true },
      });
      ctx.responseData = { [entityType]: result };
      return ctx;
    });
  }

  if (action === 'DELETE') {
    addCacheInvalidationTag(ctx, tag);
    addCacheInvalidationTag(ctx, `${tag}:public`);
    if (!id) throw new AppError(400, 'VALIDATION_ERROR', 'Entity ID is required');

    const existing = await (prisma as any)[config.tableName].findUnique({ where: { id } });
    if (!existing) {
      const notFoundKey = entityType === 'facility' ? ErrorCodes.MANDAPAM_FACILITY_NOT_FOUND : ErrorCodes.MANDAPAM_ADDON_NOT_FOUND;
      throw new AppError(404, notFoundKey, `${entityType} not found`);
    }

    await (prisma as any)[config.tableName].delete({ where: { id } });
    ctx.responseData = { deleted: true };
    return ctx;
  }

  return ctx;
}
