export interface FormulaSearchResult {
  id: string;
  description: string;
  colorCode: string;
}
export interface ExternalFormula extends FormulaSearchResult {
  components: { code: string; name: string; weightG: string }[];
  source: string;
}
export interface FormulaProvider {
  search(query: string): Promise<FormulaSearchResult[]>;
  getFormula(id: string): Promise<ExternalFormula>;
}
export class ManualFormulaProvider implements FormulaProvider {
  constructor(private readonly formulas: readonly ExternalFormula[]) {}
  async search(query: string) {
    return this.formulas.filter((f) =>
      `${f.description} ${f.colorCode}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  }
  async getFormula(id: string) {
    const formula = this.formulas.find((f) => f.id === id);
    if (!formula) throw new Error("Fórmula manual não encontrada.");
    return structuredClone(formula);
  }
}
