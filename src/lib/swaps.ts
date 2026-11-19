// Alternativas por grupo muscular e equipamento, para trocar o exercício na hora (aparelho ocupado, sem barra, academia de hotel…).
import { guessMuscle, type Muscle } from "./training.ts";

export type Equip = "barra" | "halter" | "maquina" | "cabo" | "peso_corpo" | "elastico" | "kettlebell";
export const EQUIP: Record<Equip, string> = { barra: "Barra", halter: "Halter", maquina: "Máquina", cabo: "Cabo/polia", peso_corpo: "Peso do corpo", elastico: "Elástico", kettlebell: "Kettlebell" };

const A: Partial<Record<Muscle, [string, Equip][]>> = {
  peito: [["Supino reto com barra", "barra"], ["Supino reto com halteres", "halter"], ["Supino inclinado com halteres", "halter"], ["Supino máquina", "maquina"], ["Crucifixo na máquina (peck deck)", "maquina"], ["Crossover na polia", "cabo"], ["Flexão de braço", "peso_corpo"], ["Flexão com elástico", "elastico"], ["Paralelas (foco peito)", "peso_corpo"]],
  costas: [["Barra fixa", "peso_corpo"], ["Puxada frontal na polia", "cabo"], ["Remada curvada com barra", "barra"], ["Remada unilateral com halter", "halter"], ["Remada baixa na polia", "cabo"], ["Remada máquina", "maquina"], ["Pulldown com elástico", "elastico"], ["Remada invertida", "peso_corpo"], ["Remada com kettlebell", "kettlebell"]],
  quadriceps: [["Agachamento livre", "barra"], ["Agachamento frontal", "barra"], ["Leg press", "maquina"], ["Hack squat", "maquina"], ["Agachamento goblet", "halter"], ["Búlgaro com halteres", "halter"], ["Cadeira extensora", "maquina"], ["Afundo", "peso_corpo"], ["Agachamento com kettlebell", "kettlebell"]],
  posteriores: [["Stiff com barra", "barra"], ["Stiff com halteres", "halter"], ["Mesa flexora", "maquina"], ["Cadeira flexora", "maquina"], ["Flexora com elástico", "elastico"], ["Good morning", "barra"], ["Nordic curl", "peso_corpo"], ["Swing com kettlebell", "kettlebell"]],
  gluteos: [["Elevação pélvica com barra", "barra"], ["Elevação pélvica na máquina", "maquina"], ["Glúteo na polia", "cabo"], ["Abdução na máquina", "maquina"], ["Ponte de glúteo", "peso_corpo"], ["Abdução com elástico", "elastico"], ["Passada com halteres", "halter"]],
  ombro_anterior: [["Desenvolvimento com barra", "barra"], ["Desenvolvimento com halteres", "halter"], ["Desenvolvimento máquina", "maquina"], ["Elevação frontal com halteres", "halter"], ["Flexão pike", "peso_corpo"], ["Desenvolvimento com kettlebell", "kettlebell"]],
  ombro_lateral: [["Elevação lateral com halteres", "halter"], ["Elevação lateral na polia", "cabo"], ["Elevação lateral máquina", "maquina"], ["Elevação lateral com elástico", "elastico"], ["Remada alta", "barra"]],
  ombro_posterior: [["Crucifixo inverso com halteres", "halter"], ["Crucifixo inverso na máquina", "maquina"], ["Face pull", "cabo"], ["Face pull com elástico", "elastico"]],
  biceps: [["Rosca direta com barra", "barra"], ["Rosca alternada com halteres", "halter"], ["Rosca martelo", "halter"], ["Rosca na polia", "cabo"], ["Rosca Scott máquina", "maquina"], ["Rosca com elástico", "elastico"], ["Barra fixa supinada", "peso_corpo"]],
  triceps: [["Tríceps na polia (corda)", "cabo"], ["Tríceps testa com barra", "barra"], ["Tríceps francês com halter", "halter"], ["Mergulho no banco", "peso_corpo"], ["Paralelas", "peso_corpo"], ["Tríceps máquina", "maquina"], ["Tríceps com elástico", "elastico"]],
  panturrilhas: [["Panturrilha em pé na máquina", "maquina"], ["Panturrilha sentado", "maquina"], ["Panturrilha no leg press", "maquina"], ["Panturrilha unilateral com halter", "halter"], ["Panturrilha no degrau", "peso_corpo"]],
  abdomen: [["Prancha", "peso_corpo"], ["Abdominal na polia", "cabo"], ["Elevação de pernas", "peso_corpo"], ["Abdominal máquina", "maquina"], ["Roda abdominal", "peso_corpo"], ["Pallof press", "cabo"]],
};

export function equipOf(name: string): Equip | null {
  return /m[aá]quina|leg press|hack|peck|cadeira|mesa|smith/i.test(name) ? "maquina" : /polia|cabo|cross|pulley|puxada|face pull/i.test(name) ? "cabo"
    : /halter|dumbbell|goblet/i.test(name) ? "halter" : /barra(?! fixa)|livre|terra|stiff com barra|good morning/i.test(name) ? "barra"
    : /el[aá]stico|band/i.test(name) ? "elastico" : /kettlebell/i.test(name) ? "kettlebell" : /flex[aã]o|paralela|barra fixa|prancha|peso do corpo|ponte|mergulho|nordic|invertida/i.test(name) ? "peso_corpo" : null;
}

/** Alternativas para o mesmo músculo, excluindo o próprio exercício. Filtra por equipamento se pedido. */
export function alternativesFor(name: string, muscle?: Muscle | string | null, equip?: Equip | null): { name: string; equip: Equip }[] {
  const m = (muscle && muscle in A ? muscle : guessMuscle(name)) as Muscle;
  const list = (A[m] ?? []).map(([n, e]) => ({ name: n, equip: e })).filter((x) => x.name.toLowerCase() !== name.toLowerCase());
  return equip ? list.filter((x) => x.equip === equip) : list;
}
