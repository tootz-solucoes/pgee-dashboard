export const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export const formatPercent = (value: number, fractionDigits = 1) =>
  `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}%`;

export const formatNumber = (value: number) =>
  value.toLocaleString("pt-BR");

export const formatCompact = (value: number) =>
  value.toLocaleString("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
