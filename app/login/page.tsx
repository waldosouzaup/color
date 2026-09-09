"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Field, SaveForm, value } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
export default function Login() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  return (
    <main className="login-page">
      <div className="login-theme-corner">
        <ThemeToggle compact />
      </div>
      <section className="login-story">
        <div className="brand">
          <span className="brand-mark">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>
            MESTRE<span className="brand-sub">DA COLORIMETRIA</span>
          </span>
        </div>
        <div>
          <p className="eyebrow">PRECISÃO COMEÇA NA OBSERVAÇÃO</p>
          <h1>
            Cada ajuste conta.
            <br />
            Cada cor tem
            <br />
            <em>uma história.</em>
          </h1>
          <p>
            Do primeiro ângulo à fórmula aprovada.
            <br />
            Seu conhecimento, com método e registro.
          </p>
          <div className="login-swatches">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <span className="caption">OBSERVAR → CORRIGIR → TESTAR → APROVAR</span>
      </section>
      <section className="login-form">
        <div className="login-form-inner">
          <span className="badge">ÁREA DO PROFISSIONAL</span>
          <h2>Bem-vindo à bancada.</h2>
          <p>Entre para continuar seus ajustes.</p>
          <SaveForm
            label="Entrar na oficina"
            onSubmit={async (f) => {
              const result = await authClient.signIn.email({
                email: value(f, "email"),
                password: value(f, "password"),
              });
              if (result.error?.status === 429)
                throw new Error(
                  "Muitas tentativas de entrada. Aguarde um minuto e tente novamente.",
                );
              if (result.error)
                throw new Error(
                  "E-mail ou senha inválidos. Confira seus dados e tente novamente.",
                );
              router.push("/");
              router.refresh();
            }}
          >
            <Field label="E-mail">
              <input
                name="email"
                type="email"
                autoComplete="username"
                placeholder="voce@oficina.com.br"
                required
              />
            </Field>
            <Field label="Senha">
              <span className="password-input">
                <input
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </Field>
          </SaveForm>
          <p className="login-help">
            <ShieldCheck size={16} /> Acesso restrito à sua oficina.
          </p>
          <div className="login-contact">
            Precisa de acesso? Solicite seu cadastro ao administrador da
            oficina. <ArrowRight size={15} />
          </div>
        </div>
      </section>
    </main>
  );
}
