import Image from "next/image";
import { SiteHeader, SiteFooter } from "@/components/marketing/SiteShell";
import { InventVMark } from "@/components/brand/InventLogo";

export default function SobrePage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen">
        <section className="surface-premium relative overflow-hidden text-white">
          <div className="container relative py-20 md:py-24">
            <p className="text-xs font-semibold uppercase tracking-wider text-invent-gold-300">
              Sobre
            </p>
            <h1 className="mt-2 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Somos a <span className="text-v-gradient">Invent Software</span>.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">
              ISV parceira da SAP. Premiada três anos consecutivos como melhor
              empresa de software da América Latina no ecossistema SAP Business
              One. Construímos soluções complementares que sentam dentro do SAP
              B1 e do S/4HANA Cloud ERP para automatizar fiscal, financeiro,
              contratos, folha e BI.
            </p>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 opacity-40 lg:block"
          >
            <Image
              src="/brand/products-hero.png"
              alt=""
              width={760}
              height={420}
              className="h-72 w-auto object-contain"
            />
          </div>
        </section>

        <section className="container py-20">
          <div className="grid gap-12 md:grid-cols-3">
            <Stat label="ISV SAP" value="3x" detail="Melhor da LATAM no ecossistema SAP B1" />
            <Stat
              label="Soluções nativas"
              value="SAP B1 + S/4HC"
              detail="TaxPlus · BankPlus · ContractPlus · Payroll"
            />
            <Stat
              label="Base instalada"
              value="~3.500"
              detail="Empresas usuárias dos addons Invent"
            />
          </div>

          <div className="mt-20 grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-8 md:p-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Propósito
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight md:text-3xl">
                Otimizar a performance de pessoas e empresas.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Acreditamos que automação tributária e financeira no Brasil
                tem que ser feita por quem entende o caos brasileiro de verdade
                — não pode ser uma adaptação de produto global.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8 md:p-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Por que uma Universidade
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight md:text-3xl">
                Conhecimento aplicado vale mais que software.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Todo cliente Invent recebe acesso à Universidade. Mas o
                conteúdo público vai além — quem trabalha com SAP B1 no
                Brasil encontra aqui referência prática de fiscal, financeiro
                e contratos.
              </p>
            </div>
          </div>
        </section>

        <section className="container pb-20">
          <div className="surface-premium relative overflow-hidden rounded-2xl px-8 py-12 md:px-12">
            <div className="relative z-10 flex flex-col items-start gap-4 text-white md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-5">
                <InventVMark className="h-12" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-invent-gold-300">
                    Cultura
                  </p>
                  <p className="mt-1 font-display text-xl font-bold md:text-2xl">
                    Jeito InventER de ser.
                  </p>
                </div>
              </div>
              <p className="max-w-md text-sm text-white/70">
                Empatia, crescimento, persistência e compromisso. Esses são os
                quatro pilares que definem como trabalhamos — e como
                construímos a Universidade.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-l-2 border-primary pl-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
        {value}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{detail}</div>
    </div>
  );
}
