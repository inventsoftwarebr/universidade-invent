import { cn } from "@/lib/utils";

/**
 * Logotipo "invent" do manual de marca.
 *
 * "in" + "v" (grafismo oficial vermelho/laranja em dobra) + "ent".
 * Tipografia do logo é Le Havre (Adobe Fonts) — substituída por Montserrat
 * ExtraBold por questão de licenciamento; o "v" gráfico mantém a identidade.
 */
export function InventLogo({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "mono-dark" | "mono-light";
}) {
  const textColor =
    variant === "mono-light"
      ? "fill-white"
      : variant === "mono-dark"
        ? "fill-[#535260]"
        : "fill-[#535260] dark:fill-white";

  return (
    <svg
      viewBox="0 0 220 64"
      className={cn("h-8 w-auto", className)}
      aria-label="invent"
      role="img"
    >
      <text
        x="0"
        y="48"
        className={cn(
          "font-display",
          textColor,
        )}
        style={{
          fontFamily: "var(--font-sans), system-ui",
          fontSize: "56px",
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
        in
      </text>
      {/* V grafismo: triângulo vermelho + triângulo amarelo formando o "v" 3D */}
      <g transform="translate(58, 8)">
        {variant === "mono-light" || variant === "mono-dark" ? (
          <>
            <polygon
              points="0,0 14,0 26,40 19,52"
              className={variant === "mono-light" ? "fill-white" : "fill-[#535260]"}
            />
            <polygon
              points="14,0 28,0 30,52 26,40"
              className={variant === "mono-light" ? "fill-white/70" : "fill-[#535260]/70"}
            />
          </>
        ) : (
          <>
            {/* Face frontal vermelha */}
            <polygon points="0,0 14,0 26,40 19,52" fill="#E41216" />
            {/* Face lateral amarela/dourada */}
            <polygon points="14,0 28,0 30,52 26,40" fill="#FBB33B" />
            {/* Gradiente sutil de profundidade */}
            <polygon points="14,0 28,0 28,4 14,4" fill="#FBBD3B" opacity="0.6" />
          </>
        )}
      </g>
      <text
        x="92"
        y="48"
        className={cn(
          "font-display",
          textColor,
        )}
        style={{
          fontFamily: "var(--font-sans), system-ui",
          fontSize: "56px",
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
        ent
      </text>
    </svg>
  );
}

/**
 * Apenas o grafismo "V invent" (sem texto). Use como ícone, favicon,
 * elemento decorativo em backgrounds ou empty states.
 */
export function InventVMark({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "outline" | "solid-red" | "solid-yellow";
}) {
  if (variant === "outline") {
    return (
      <svg viewBox="0 0 64 80" className={cn("h-10 w-auto", className)} aria-hidden>
        <polygon points="6,0 22,0 38,60 30,80" fill="none" stroke="#E41216" strokeWidth="2" />
        <polygon points="22,0 38,0 42,80 38,60" fill="none" stroke="#FBB33B" strokeWidth="2" />
      </svg>
    );
  }
  if (variant === "solid-red") {
    return (
      <svg viewBox="0 0 64 80" className={cn("h-10 w-auto", className)} aria-hidden>
        <polygon points="6,0 22,0 38,60 30,80" fill="#E41216" />
        <polygon points="22,0 38,0 42,80 38,60" fill="#B6221A" />
      </svg>
    );
  }
  if (variant === "solid-yellow") {
    return (
      <svg viewBox="0 0 64 80" className={cn("h-10 w-auto", className)} aria-hidden>
        <polygon points="6,0 22,0 38,60 30,80" fill="#FBB33B" />
        <polygon points="22,0 38,0 42,80 38,60" fill="#FBBD3B" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 80" className={cn("h-10 w-auto", className)} aria-hidden>
      <polygon points="6,0 22,0 38,60 30,80" fill="#E41216" />
      <polygon points="22,0 38,0 42,80 38,60" fill="#FBB33B" />
      <polygon points="22,0 38,0 38,6 22,6" fill="#FBBD3B" opacity="0.5" />
    </svg>
  );
}
