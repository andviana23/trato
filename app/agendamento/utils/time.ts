import dayjs from "dayjs";

export const INICIO_DIA = "05:00";
export const FIM_DIA = "22:00";
export const SLOT_MIN = 15;
export const PX_POR_MIN = 2.0; // 15 min = 30px

export function minutosDesde(inicioHHmm: string, iso: string) {
  const [h0, m0] = inicioHHmm.split(":").map(Number);
  const base = dayjs().hour(h0).minute(m0).second(0);
  return dayjs(iso).diff(base, "minute");
}

export function duracaoMin(inicioISO: string, fimISO: string) {
  return dayjs(fimISO).diff(dayjs(inicioISO), "minute");
}

export function totalMinutosDia(inicioHHmm = INICIO_DIA, fimHHmm = FIM_DIA) {
  const [h0, m0] = inicioHHmm.split(":").map(Number);
  const [h1, m1] = fimHHmm.split(":").map(Number);
  const a = dayjs().hour(h0).minute(m0);
  const b = dayjs().hour(h1).minute(m1);
  return b.diff(a, "minute");
}




