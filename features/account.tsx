"use client";
import { useState } from "react";
import { Heading, Field, SaveForm, Alert, value } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import type { Workspace } from "@/lib/client-types";

export function AccountView({ workspace }: { workspace: Workspace }) {
  const [saved, setSaved] = useState(false);
  return (
    <>
      <Heading
        eyebrow="ACESSO À OFICINA"
        title="Minha conta"
        description={`${workspace.actor.name} · ${workspace.organization.name}`}
      />
      <section className="panel account-panel">
        <h2>Alterar senha</h2>
        <p>Use pelo menos 12 caracteres. Os outros acessos serão encerrados.</p>
        {saved && <Alert>Senha alterada e outras sessões encerradas.</Alert>}
        <SaveForm
          label="Alterar minha senha"
          onSubmit={async (form) => {
            setSaved(false);
            const next = value(form, "newPassword");
            if (next !== value(form, "confirmPassword"))
              throw new Error("A confirmação precisa ser igual à nova senha.");
            const result = await authClient.changePassword({
              currentPassword: value(form, "currentPassword"),
              newPassword: next,
              revokeOtherSessions: true,
            });
            if (result.error)
              throw new Error(
                "Não foi possível alterar a senha. Confira a senha atual e tente novamente.",
              );
            setSaved(true);
          }}
        >
          <Field label="Senha atual">
            <input
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
            />
          </Field>
          <Field label="Nova senha">
            <input
              name="newPassword"
              type="password"
              minLength={12}
              maxLength={128}
              required
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirme a nova senha">
            <input
              name="confirmPassword"
              type="password"
              minLength={12}
              maxLength={128}
              required
              autoComplete="new-password"
            />
          </Field>
        </SaveForm>
      </section>
    </>
  );
}
