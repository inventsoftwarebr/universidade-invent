import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logotipo oficial Invent Software.
 *
 * - `default` / `dark-bg` → `invent-branca.png` (para fundos escuros)
 * - `light-bg` → `invent-cinza.png` (cinza + V colorido, fundos claros)
 */
export function InventLogo({
  className,
  variant = "light-bg",
  priority = false,
}: {
  className?: string;
  variant?: "light-bg" | "dark-bg";
  priority?: boolean;
}) {
  const src =
    variant === "dark-bg" ? "/brand/invent-branca.png" : "/brand/invent-cinza.png";
  return (
    <Image
      src={src}
      alt="invent software"
      width={3706}
      height={1271}
      priority={priority}
      className={cn("h-8 w-auto", className)}
    />
  );
}

/**
 * Apenas o "V" da marca (gradiente vertical dourado→vermelho).
 * Usar como ícone (favicon, badges, accents) — sem o wordmark.
 */
export function InventVMark({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/v-mark.png"
      alt=""
      aria-hidden
      width={715}
      height={726}
      priority={priority}
      className={cn("h-10 w-auto self-start", className)}
    />
  );
}

/**
 * Logos de produtos Invent (TaxPlus, BankPlus, ContractPlus).
 * Cada produto tem sua cor brand (roxo / dourado / vermelho).
 */
export function ProductLogo({
  product,
  variant = "light-bg",
  className,
}: {
  product: "taxplus" | "bankplus" | "contractplus";
  variant?: "light-bg" | "dark-bg";
  className?: string;
}) {
  // TaxPlus uses "cinza" (gray) variant for light backgrounds; the others use "preta" (black).
  const file =
    variant === "dark-bg"
      ? `${product}-branca.png`
      : product === "taxplus"
        ? "taxplus-cinza.png"
        : `${product}-preta.png`;
  const alt =
    product === "taxplus"
      ? "TaxPlus"
      : product === "bankplus"
        ? "BankPlus"
        : "ContractPlus";
  // Dimensões nativas: bankplus/contractplus são 4500x4500, taxplus 3300x2550.
  const [w, h] =
    product === "taxplus" ? [3300, 2550] : [4500, 4500];
  return (
    <Image
      src={`/brand/${file}`}
      alt={alt}
      width={w}
      height={h}
      className={cn("h-8 w-auto", className)}
    />
  );
}
