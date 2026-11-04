export interface EvaluationDraftValue {
  /** 客观项原始值文本；支持数字、千分位和 inf。 */
  objectiveRaw?: string;
  /** 主观项 0~10，内部保存为 0~100 的整数。 */
  subjectiveScore?: number | null;
  note?: string;
}

export interface EvaluationDraft {
  id: string;
  brand: string;
  model: string;
  testDate: string;
  engineer: string;
  remark: string;
  ruleVersion: string;
  values: Record<string, EvaluationDraftValue>;
  updatedAt: string;
}

export interface ImportValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  valueCount: number;
  draft?: EvaluationDraft;
}
