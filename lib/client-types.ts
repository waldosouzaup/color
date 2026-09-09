import type { Prisma } from "@prisma/client";
import type { getWorkspace } from "@/repositories/workspace";
type Serialized<T> = T extends Date
  ? string
  : T extends Prisma.Decimal
    ? string
    : T extends (infer U)[]
      ? Serialized<U>[]
      : T extends object
        ? { [K in keyof T]: Serialized<T[K]> }
        : T;
export type Workspace = Serialized<Awaited<ReturnType<typeof getWorkspace>>>;
export type Adjustment = Workspace["sessions"][number];
export type Formula = Workspace["formulas"][number];
export type Pigment = Workspace["pigments"][number];
