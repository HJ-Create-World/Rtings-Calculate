export interface IntroCard {
  title: string;
  description: string;
  points?: string[];
}

export const capabilityCards: IntroCard[] = [
  {
    title: '结构化评分引擎',
    description: '把 Rtings 规则拆成节点树与权重路径，支持缺失子项重归一和逐级 0.1 舍入。',
    points: ['132 个评分节点', '93 条评分映射', 'Mixed Usage 总分']
  },
  {
    title: '全链路计算追踪',
    description: '从原始输入、命中锚点、单项评分到权重贡献都可以回查，避免黑盒打分。',
    points: ['叶子测试项追踪', '主维度贡献追踪', '警告与预估标注']
  },
  {
    title: '工程师录入工作台',
    description: '覆盖客观测试值、主观评分、必填档案校验、草稿自动保存和本机历史。',
    points: ['94 个计入评分测试项', '日期选择器与类别选择', '本地/云端双保存']
  },
  {
    title: 'Excel 批量导入',
    description: '按主维度生成模板，前端解析工作簿并校验后再写入评分草稿。',
    points: ['分组模板下载', '本地解析校验', '一键进入录入页']
  },
  {
    title: '多维度对比分析',
    description: '支持 Rtings 基准机型与自建评测共同参与评分天梯图、雷达和贡献对比。',
    points: ['107 款 Rtings 基准', '屏幕/背光/尺寸筛选', '天梯图与 Top N 展示']
  },
  {
    title: '交互与全屏体验',
    description: '筛选结果全选、已选折叠、排序天梯图、下拉浮层防裁剪与全屏滚动查看。',
    points: ['高分置顶排序', '全屏滚动查看', '下拉浮层自动定位']
  },
  {
    title: '云端历史与报告',
    description: '保存完整输入快照和规则版本，支持再次载入修改并导出完整报告。',
    points: ['输入快照', '载入修改', 'Excel 嵌入图表']
  }
];

export const advantageRows = [
  {
    before: 'Rtings 官方不公开评分公式，结果只能引用难以复算',
    after: '基于 107 款公开数据反推锚点曲线，输出可复算、可追问的评分路径'
  },
  {
    before: '工程师规则散落在 Excel 表格中，版本和口径难管理',
    after: '规则版本、节点权重、证据等级和映射表进入可维护的数据结构'
  },
  {
    before: '单项分、维度分和总分之间靠人工查表与公式拼接',
    after: '自动聚合、缺失重归一、范围外预估和警告提示一次完成'
  },
  {
    before: '历史机型数据难以沉淀，横向对比需要重新整理',
    after: 'Rtings 基准、云端评测和本机评测进入统一产品库，可随时对比'
  },
  {
    before: '向 leader / 项目组汇报时缺少结构化材料',
    after: '一键导出带测试项明细、计算追踪和总览图表的 Excel 报告'
  }
];

export const difficultyCards: IntroCard[] = [
  {
    title: '规则黑盒拆解',
    description: 'Rtings 未公布公式，只能用 107 组原始值与得分观察单调曲线并验证权重。',
    points: ['不把回归系数当作公式', '保留 CSV 实测锚点']
  },
  {
    title: '双源规则融合',
    description: '工程师表和 CSV 反推不是简单取交集，需要逐项判断证据等级。',
    points: ['96.6% 得分档一致', '冲突区间显式标注']
  },
  {
    title: '缺失数据处理',
    description: '不支持、未测、废弃和 CSV 缺列必须区分，不能统一补零。',
    points: ['缺失重归一', '不计入与废弃分离', '主观项显式标记']
  },
  {
    title: '范围外评分',
    description: '实验室新机型可能优于历史数据范围，需要给出参考分但不掩盖不确定性。',
    points: ['线性外推', '0~10 限幅', '范围外预估提示']
  }
];

export const timeline = [
  {
    date: '2026-06-01',
    title: '规划、数据采集与规则反推',
    description: '建立评分口径与统计框架，启动 Rtings 官方数据采集，整理 107 款机型 × 344 列数据，并开始评分规则反推与验证。'
  },
  {
    date: '2026-11-04',
    title: '规则基线与核心引擎',
    description: '在前期反推结论基础上确认工程口径，建立 TypeScript 评分核心、规则导入和权威基准测试。'
  },
  {
    date: '2026-11-05',
    title: '录入工作台与部署',
    description: '上线实时单项评分、分组 Excel 模板和预览部署。'
  },
  {
    date: '2026-11-06',
    title: '融合规则与云端闭环',
    description: '接入 107 款 CSV 回归基准，建立云端评测、历史载入和完整 Excel 导出。'
  },
  {
    date: '2026-11-11',
    title: '规则结构与计算收口',
    description: '重构导航与产品搜索，修正 CAD@60 客观锚点、特殊子维度权重和范围外预估。'
  },
  {
    date: '2026-11-12',
    title: '展示与录入增强',
    description: '统一展示顺序，丰富主维度权重与 7/8 分参考值，接入演示视频和系统介绍页。'
  },
  {
    date: '2026-11-13',
    title: '筛选、排序与天梯图',
    description: '上线产品全选/筛选、屏幕与背光档案、评分天梯图、贡献堆叠天梯图，并修复下拉浮层、排序方向和全屏滚动。'
  }
];

export const milestoneRows = [
  { version: '规则研究版', date: '2026-06-01 ~ 2026-11-03', summary: '规划与口径确认、Rtings 数据采集、统计汇总、规则反推、评分曲线验证与工程师表融合' },
  { version: 'v0.1.0', date: '2026-11-04 ~ 2026-11-05', summary: '评分核心、规则导入、只读展示、对比图、录入与 Excel 导入' },
  { version: '规则 v3.0', date: '2026-11-06', summary: '融合工程师表与 CSV 反推；接入云端持久化、历史载入和报告导出' },
  { version: '当前迭代', date: '2026-11-12 ~ 2026-11-13', summary: '展示顺序统一；产品档案扩展；全选筛选；评分天梯图；贡献堆叠天梯图；类别项与交互修复' }
];

export const roadmapCards: IntroCard[] = [
  {
    title: '测试方法与规则可视化',
    description: '把每个测试项的设备、环境、步骤、数据处理、备注、参考图片/视频与评分锚点做成结构化知识库。',
    points: ['测试方法页', '评分区间可视化', '媒体资料管理']
  },
  {
    title: '权限与数据安全',
    description: '从公开读写升级为账号/角色权限，保证评测数据只能由授权工程师修改。',
    points: ['登录态接入', 'owner-only RLS', '操作审计']
  },
  {
    title: '大规模数据存储',
    description: '为批量机型和长周期评测设计分表、索引与冷热数据策略。',
    points: ['评测明细拆表', '索引与分页', '冷热归档']
  },
  {
    title: '规则版本发布与回档',
    description: '把 Draft / Review / Published / Deprecated 生命周期产品化，支持历史评测固定旧版本。',
    points: ['规则发布流水线', '基准回归报告', '一键回档']
  },
  {
    title: '质量看板与异常治理',
    description: '聚合范围外、缺项、警告和高偏差样本，形成规则与实测质量看板。',
    points: ['缺项热力图', '预估分占比', '回归差异追踪']
  },
  {
    title: '自动化报告中心',
    description: '按项目、批次、机型自动生成对比报告和验收摘要，减少人工整理。',
    points: ['报告模板', '定时导出', '团队分享']
  },
  {
    title: '小程序移动录入',
    description: '复用评分核心与云端接口，先做现场录入和历史查看，再做移动端对比。',
    points: ['现场录入', '历史查询', '轻量对比']
  }
];

export const sourceRows = [
  { label: 'Rtings 公开数据', value: 'rtings_data.csv：107 款机型 × 344 列（172 个测试项的原始值 + 得分）' },
  { label: '工程师拆解表', value: 'Rtings计算文档.xlsx：8 个工作表，包含权重树、7/8 分门槛、得分范围与实测样本' },
  { label: '融合规则', value: 'CSV 反推 + 工程师门槛/样本；无法 CSV 验证处标注 A/B/C/D 证据等级' }
];

export const accuracyRows = [
  { label: 'CSV 总分回归', value: '107 款中 104 款误差 ≤0.1；3 款误差 ≤0.2（含 QN900F 8K 已知例外）' },
  { label: '得分档一致性', value: '工程师分档与 CSV 可比分档 96.6% 一致（767/794）' },
  { label: '自动化测试', value: '15 项 Vitest 测试覆盖核心映射、规则聚合、CSV 回归与输入引用' }
];
