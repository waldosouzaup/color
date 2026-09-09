import { redirect } from "next/navigation";
import { AppError, getActor } from "@/lib/access";
import { Workbench } from "@/features/workbench";
export const dynamic = "force-dynamic";
export default async function Page() {
  try {
    await getActor();
  } catch (error) {
    if (error instanceof AppError && [401, 403].includes(error.status)) redirect("/login");
    throw error;
  }
  return <Workbench />;
}
