"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="loading-page">
      <h1>Não foi possível abrir a oficina.</h1>
      <p>
        Confira sua conexão e tente novamente. Seus registros permanecem salvos.
      </p>
      <button className="button primary" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
