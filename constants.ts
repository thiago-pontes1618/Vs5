export const BIBLIOTECA = {
  DISCIPLINA: {
    Vice: "🛑 **CONVIVÊNCIA:** Baseado em *Kay Pranis*. Foco na responsabilização. 👉 Ação: Círculo de Paz.",
    Tutor: "🛑 **CNV:** *Rosenberg*: Comportamento é necessidade. 👉 Ação: Escuta Empática."
  },
  FREQUENCIA: {
    Vice: "⚠️ **BUSCA ATIVA:** *Guia UNICEF*. Esgotar recursos antes da rede. 👉 Ação: Contato Imediato.",
    Tutor: "⚠️ **VÍNCULO:** A permanência depende do pertencimento. 👉 Ação: Mensagem de acolhimento."
  },
  APRENDIZAGEM: {
    Coord: (contexto: string) => `📉 **DIDÁTICA:** Aluno na ZDP. Use *Bloom* para graduar. 👉 Foco: ${contexto}.`,
    Tutor: (contexto: string) => `📉 **ROTINA:** *Nóvoa*: Autonomia. 👉 Ação: Organizar estudos em: ${contexto}.`
  },
  EXCELENCIA: {
    Vice: "💎 **TALENTOS:** *BNCC*. 👉 Ação: Liderança.",
    Tutor: "💎 **MONITORIA:** Ensino entre pares. 👉 Ação: Convidar monitor."
  }
};

export const INITIAL_CONFIG = {
  turma: '',
  meta: '6.0',
  nomeVice: '',
  telVice: '',
  nomeCoord: '',
  telCoord: '',
  linkForms: '',
  linkAgenda: 'https://calendar.app.google/pWbvtZwKv711HePs7'
};