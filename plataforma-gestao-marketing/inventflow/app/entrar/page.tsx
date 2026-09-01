import { redirect } from "next/navigation";
import { currentUser, authMode } from "@/lib/auth";
import { listPeople } from "@/lib/queries";
import { entrarComo } from "../actions";
import { Avatar } from "@/components/ui";

export default async function EntrarPage() {
  if (await currentUser()) redirect("/");

  const modo = authMode();
  const people = modo === "piloto" ? await listPeople() : [];

  return (
    <main className="signin">
      <span className="brand">InventFlow</span>
      <p className="muted" style={{ marginBottom: 22 }}>
        Projetos e iniciativas do Marketing da Invent Software.
      </p>

      {modo === "entra" ? (
        <>
          <p style={{ marginBottom: 16 }}>
            Entre com a sua conta Microsoft da Invent. Não há senha própria nesta
            plataforma.
          </p>
          <a className="btn" href="/api/auth/login">
            Entrar com a conta Invent
          </a>
        </>
      ) : (
        <>
          <div className="notice">
            <b>Modo piloto.</b> O login com a conta Microsoft ainda não está
            configurado, então basta escolher quem você é. Serve ao alpha e ao beta
            internos — nunca a produção com dado real.
          </div>
          <div className="people-list">
            {people.map((person) => (
              <form key={person.id} action={entrarComo}>
                <input type="hidden" name="personId" value={person.id} />
                <button type="submit">
                  <Avatar name={person.name} />
                  {person.name}
                  <span className="role">{person.jobTitle}</span>
                </button>
              </form>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
