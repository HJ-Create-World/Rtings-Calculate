export type NodeId = string;

export type NodeKind = 'group' | 'dimension' | 'leaf';

export type InputType = 'objective' | 'subjective' | 'aggregate';

export type Direction = 'higherBetter' | 'lowerBetter';

export type ScoreStatus = 'scored' | 'incomplete' | 'excluded';

export type IntervalSource = 'actualSample' | 'engineerEstimate' | 'manual';

/** 分数使用 8~100 表示 0.8~10.0；主观项可为 0~100。 */
export type ScoreTenths = number;

export interface MappingInterval {
  /** 区间所属分数，单位：0.1 分。 */
  scoreTenths: ScoreTenths;
  /** null 表示开放下界或无穷小。 */
  min: number | null;
  /** null 表示开放上界；10.0 分通常使用开放上界。 */
  max: number | null;
  minInclusive: boolean;
  maxInclusive: boolean;
  source: IntervalSource;
  /** 仅用于显式 inf：只有 value === Infinity 才命中。 */
  infiniteOnly?: boolean;
  note?: string;
}

export interface ObjectiveMapping {
  id: string;
  label: string;
  unit: string;
  direction: Direction;
  intervals: MappingInterval[];
}

export interface ScoreNode {
  id: NodeId;
  parentId: NodeId | null;
  label: string;
  kind: NodeKind;
  inputType: InputType;
  /** 相对父项的权重；null 表示源表 NA。 */
  weight: number | null;
  /** 显式声明是否参与父项；不依赖权重是否为数值推断。 */
  includeInParent: boolean;
  mappingId?: string;
  unit?: string;
}

export interface ObjectiveInput {
  /** null 表示未填写；Infinity 表示 inf。 */
  value: number | null;
  note?: string;
}

export interface SubjectiveInput {
  /** 0~100，表示 0.0~10.0；null 表示未填写。 */
  scoreTenths: ScoreTenths | null;
  enteredBy?: string;
  note?: string;
}

export interface NodeInput {
  objective?: ObjectiveInput;
  subjective?: SubjectiveInput;
}

export type EvaluationInputs = Record<NodeId, NodeInput>;

export interface RuleWarning {
  code:
    | 'WEIGHT_SUM_NOT_ONE'
    | 'NO_MATCHING_INTERVAL'
    | 'OVERLAP_INTERVALS'
    | 'INVALID_SUBJECTIVE_SCORE'
    | 'INVALID_RULE'
    | 'INCOMPLETE_CHILD';
  message: string;
  nodeId?: NodeId;
}

export interface Contribution {
  childId: NodeId;
  weight: number;
  childValue: number;
  contribution: number;
}

export interface MappingTrace {
  mappingId: string;
  value: number | null;
  matchedInterval?: MappingInterval;
  scoreTenths: ScoreTenths | null;
  status: Extract<ScoreStatus, 'scored' | 'incomplete'>;
  warnings: RuleWarning[];
}

export interface NodeEvaluation {
  nodeId: NodeId;
  status: ScoreStatus;
  /** 仅在 scored 时有值；incomplete 时不给正式分。 */
  value: number | null;
  /** partialValue 便于排查，不作为正式结果。 */
  partialValue: number;
  /** 相对父项的贡献；未计入父项时为 null。 */
  contributionToParent: number | null;
  children: NodeEvaluation[];
  mappingTrace?: MappingTrace;
  subjectiveScoreTenths?: ScoreTenths | null;
  warnings: RuleWarning[];
}

export interface EvaluationResult {
  rootId: NodeId;
  status: ScoreStatus;
  value: number | null;
  partialValue: number;
  nodes: Record<NodeId, NodeEvaluation>;
  warnings: RuleWarning[];
}

export interface ScoringRule {
  /** 规则版本；历史评测必须绑定该值。 */
  version: string;
  rootId: NodeId;
  nodes: ScoreNode[];
  mappings: ObjectiveMapping[];
}
