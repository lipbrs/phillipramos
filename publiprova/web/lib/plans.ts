import type { PlanId } from './types';
import { countActiveCampaigns, countCreatorsThisMonth } from './store';

/**
 * Limites por plano. `creatorsPerMonth` é a métrica que cresce com o
 * valor entregue — e o limite NUNCA é aplicado a uma campanha já criada:
 * a checagem acontece só na criação, para não sabotar um fechamento.
 */
export const PLANS: Record<PlanId, {
  label: string;
  price: string;
  activeCampaigns: number;
  creatorsPerMonth: number;
}> = {
  free:    { label: 'Grátis',  price: 'R$ 0',      activeCampaigns: 1,        creatorsPerMonth: 5 },
  solo:    { label: 'Solo',    price: 'R$ 97/mês', activeCampaigns: 3,        creatorsPerMonth: 30 },
  agencia: { label: 'Agência', price: 'R$ 247/mês', activeCampaigns: Infinity, creatorsPerMonth: 150 },
  studio:  { label: 'Studio',  price: 'R$ 597/mês', activeCampaigns: Infinity, creatorsPerMonth: 500 },
};

export type PlanUsage = {
  plan: PlanId;
  activeCampaigns: number;
  activeCampaignsLimit: number;
  creatorsThisMonth: number;
  creatorsPerMonth: number;
};

export async function planUsage(agencyId: string, plan: PlanId): Promise<PlanUsage> {
  const limits = PLANS[plan] ?? PLANS.free;
  const [activeCampaigns, creatorsThisMonth] = await Promise.all([
    countActiveCampaigns(agencyId),
    countCreatorsThisMonth(agencyId),
  ]);
  return {
    plan,
    activeCampaigns,
    activeCampaignsLimit: limits.activeCampaigns,
    creatorsThisMonth,
    creatorsPerMonth: limits.creatorsPerMonth,
  };
}

/** null = pode criar; string = mensagem do bloqueio (mostrada no painel). */
export async function checkCreateAllowed(
  agencyId: string,
  plan: PlanId,
  newCreators: number,
): Promise<string | null> {
  const u = await planUsage(agencyId, plan);
  const limits = PLANS[plan] ?? PLANS.free;
  if (u.activeCampaigns >= limits.activeCampaigns) {
    return `O plano ${limits.label} permite ${limits.activeCampaigns} campanha(s) ativa(s). ` +
      `Encerre uma campanha ou faça upgrade para criar outra.`;
  }
  if (u.creatorsThisMonth + newCreators > limits.creatorsPerMonth) {
    return `O plano ${limits.label} inclui ${limits.creatorsPerMonth} creators/mês e você já usou ` +
      `${u.creatorsThisMonth}. Esta campanha adicionaria ${newCreators}. Reduza a lista ou faça upgrade.`;
  }
  return null;
}
