import { db } from "../lib/db";
import { lazzurilFullCatalog } from "../domain/colorimetry/lazzuril-catalog";

export async function seedLazzurilBases(organizationId: string, tx = db) {
  let count = 0;
  for (const base of lazzurilFullCatalog) {
    await tx.pigment.upsert({
      where: {
        organizationId_manufacturer_productLine_code: {
          organizationId,
          manufacturer: base.manufacturer,
          productLine: base.productLine,
          code: base.code,
        },
      },
      create: {
        organizationId,
        manufacturer: base.manufacturer,
        productLine: base.productLine,
        code: base.code,
        name: base.name,
        systemType: base.systemType,
        family: base.family,
        characteristic: base.characteristic ?? null,
        description: base.description,
        isDemo: false,
        active: true,
        behaviors: {
          create: base.behaviors.map((b) => ({
            view: b.view,
            hueCharacteristic: b.hueCharacteristic ?? "",
            lightnessEffect: b.lightnessEffect ?? "",
            cleanlinessEffect: b.cleanlinessEffect ?? "",
            particleEffect: b.particleEffect ?? "",
            notes: b.notes ?? "",
            source: b.source,
            sourceReference: b.sourceReference,
          })),
        },
      },
      update: {
        name: base.name,
        systemType: base.systemType,
        family: base.family,
        characteristic: base.characteristic ?? null,
        description: base.description,
        isDemo: false,
        active: true,
      },
    });
    count++;
  }
  return count;
}
