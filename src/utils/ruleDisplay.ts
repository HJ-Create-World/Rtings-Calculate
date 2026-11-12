import type { ScoreNode } from '../core/types';
import { rtingsRule } from '../data/rtingsRule';

/**
 * 主维度展示顺序来自《Rtings计算文档.xlsx》的 Rtings评测拆解 sheet。
 * Processing 在 Motion Handling 前面；Ambient 0 lx 在 1000 lx 前面。
 */
const MAIN_DIMENSION_IDS = [
  'mixed-usage.brightness',
  'mixed-usage.black-level',
  'mixed-usage.color',
  'mixed-usage.processing',
  'mixed-usage.motion-handling',
  'mixed-usage.game-mode',
  'mixed-usage.direct-reflections',
  'mixed-usage.ambient-black'
];

const CHILD_ORDER: Record<string, string[]> = {
  'mixed-usage.brightness': [
    'mixed-usage.brightness.hdr',
    'mixed-usage.brightness.sdr'
  ],
  'mixed-usage.black-level': [
    'mixed-usage.black-level.contrast',
    'mixed-usage.black-level.uniformity',
    'mixed-usage.black-level.zone-precision'
  ],
  'mixed-usage.color': [
    'mixed-usage.color.hdr-volume',
    'mixed-usage.color.sdr-volume',
    'mixed-usage.color.sdr-precal',
    'mixed-usage.color.hdr-precal',
    'mixed-usage.color.sdr-postcal',
    'mixed-usage.color.hdr-postcal'
  ],
  'mixed-usage.processing': [
    'mixed-usage.processing.smoothing',
    'mixed-usage.processing.upscaling',
    'mixed-usage.processing.pq-eotf',
    'mixed-usage.processing.gradient'
  ],
  'mixed-usage.motion-handling': [
    'mixed-usage.motion.judder',
    'mixed-usage.motion.stutter',
    'mixed-usage.motion.transition',
    'mixed-usage.motion.response-time',
    'mixed-usage.motion.micro-judder',
    'mixed-usage.motion.zone-transitions'
  ],
  'mixed-usage.game-mode': [
    'mixed-usage.game-mode.input-lag',
    'mixed-usage.game-mode.cad-60',
    'mixed-usage.game-mode.cad-120',
    'mixed-usage.game-mode.cad-max',
    'mixed-usage.game-mode.vrr',
    'mixed-usage.game-mode.resolutions'
  ],
  'mixed-usage.direct-reflections': [
    'mixed-usage.direct-reflections.peak'
  ],
  'mixed-usage.ambient-black': [
    'mixed-usage.ambient-black.0lx',
    'mixed-usage.ambient-black.1000lx'
  ]
};

const LEAF_ORDER: Record<string, string[]> = {
  'mixed-usage.brightness.hdr': [
    'mixed-usage.brightness.hdr.hallway',
    'mixed-usage.brightness.hdr.yellow',
    'mixed-usage.brightness.hdr.landscape',
    'mixed-usage.brightness.hdr.peak2',
    'mixed-usage.brightness.hdr.peak10',
    'mixed-usage.brightness.hdr.peak25',
    'mixed-usage.brightness.hdr.peak50',
    'mixed-usage.brightness.hdr.peak100',
    'mixed-usage.brightness.hdr.abl'
  ],
  'mixed-usage.brightness.sdr': [
    'mixed-usage.brightness.sdr.619',
    'mixed-usage.brightness.sdr.609',
    'mixed-usage.brightness.sdr.610',
    'mixed-usage.brightness.sdr.611',
    'mixed-usage.brightness.sdr.612',
    'mixed-usage.brightness.sdr.613'
  ],
  'mixed-usage.black-level.contrast': [
    'mixed-usage.black-level.contrast.ld-on',
    'mixed-usage.black-level.contrast.native'
  ],
  'mixed-usage.black-level.uniformity': [
    'mixed-usage.black-level.uniformity.641',
    'mixed-usage.black-level.uniformity.130'
  ],
  'mixed-usage.black-level.zone-precision': [
    'mixed-usage.black-level.zone-precision'
  ],
  'mixed-usage.color.hdr-volume': [
    'mixed-usage.color.hdr-volume.itp'
  ],
  'mixed-usage.color.sdr-volume': [
    'mixed-usage.color.sdr-volume.28334',
    'mixed-usage.color.sdr-volume.28336'
  ],
  'mixed-usage.color.sdr-precal': [
    'mixed-usage.color.sdr-precal.150',
    'mixed-usage.color.sdr-precal.154',
    'mixed-usage.color.sdr-precal.1937'
  ],
  'mixed-usage.color.hdr-precal': [
    'mixed-usage.color.hdr-precal.29345',
    'mixed-usage.color.hdr-precal.29346',
    'mixed-usage.color.hdr-precal.29347'
  ],
  'mixed-usage.color.sdr-postcal': [
    'mixed-usage.color.sdr-postcal'
  ],
  'mixed-usage.color.hdr-postcal': [
    'mixed-usage.color.hdr-postcal'
  ],
  'mixed-usage.processing.smoothing': [
    'mixed-usage.processing.smoothing.18015',
    'mixed-usage.processing.smoothing.18016'
  ],
  'mixed-usage.processing.upscaling': [
    'mixed-usage.processing.upscaling'
  ],
  'mixed-usage.processing.pq-eotf': [
    'mixed-usage.processing.pq-eotf.13904',
    'mixed-usage.processing.pq-eotf.13905',
    'mixed-usage.processing.pq-eotf.13906'
  ],
  'mixed-usage.processing.gradient': [
    'mixed-usage.processing.gradient.18399',
    'mixed-usage.processing.gradient.18400',
    'mixed-usage.processing.gradient.18401',
    'mixed-usage.processing.gradient.18402',
    'mixed-usage.processing.gradient.18403',
    'mixed-usage.processing.gradient.18404',
    'mixed-usage.processing.gradient.18405',
    'mixed-usage.processing.gradient.18406'
  ],
  'mixed-usage.motion.judder': [
    'mixed-usage.motion.judder.36315',
    'mixed-usage.motion.judder.36316',
    'mixed-usage.motion.judder.36313',
    'mixed-usage.motion.judder.36314',
    'mixed-usage.motion.judder.36317',
    'mixed-usage.motion.judder.36318',
    'mixed-usage.motion.judder.36319'
  ],
  'mixed-usage.motion.stutter': [
    'mixed-usage.motion.stutter.39752',
    'mixed-usage.motion.stutter.1925'
  ],
  'mixed-usage.motion.transition': [
    'mixed-usage.motion.transition.39013',
    'mixed-usage.motion.transition.39027'
  ],
  'mixed-usage.motion.response-time': [
    'mixed-usage.motion.response-time.30862',
    'mixed-usage.motion.response-time.30860',
    'mixed-usage.motion.response-time.30861'
  ],
  'mixed-usage.motion.micro-judder': [
    'mixed-usage.motion.micro-judder.36112',
    'mixed-usage.motion.micro-judder.36113',
    'mixed-usage.motion.micro-judder.36114',
    'mixed-usage.motion.micro-judder.36115',
    'mixed-usage.motion.micro-judder.36116',
    'mixed-usage.motion.micro-judder.36117'
  ],
  'mixed-usage.motion.zone-transitions': [
    'mixed-usage.motion.zone-transitions'
  ],
  'mixed-usage.game-mode.input-lag': [
    'mixed-usage.game-mode.input-lag.25',
    'mixed-usage.game-mode.input-lag.1466',
    'mixed-usage.game-mode.input-lag.12237',
    'mixed-usage.game-mode.input-lag.542',
    'mixed-usage.game-mode.input-lag.543',
    'mixed-usage.game-mode.input-lag.2194',
    'mixed-usage.game-mode.input-lag.12239'
  ],
  'mixed-usage.game-mode.cad-60': [
    'mixed-usage.game-mode.cad-60.avg',
    'mixed-usage.game-mode.cad-60.best',
    'mixed-usage.game-mode.cad-60.worst'
  ],
  'mixed-usage.game-mode.cad-120': [
    'mixed-usage.game-mode.cad-120.30878',
    'mixed-usage.game-mode.cad-120.30879',
    'mixed-usage.game-mode.cad-120.30880'
  ],
  'mixed-usage.game-mode.cad-max': [
    'mixed-usage.game-mode.cad-max.30870',
    'mixed-usage.game-mode.cad-max.30871',
    'mixed-usage.game-mode.cad-max.30872'
  ],
  'mixed-usage.game-mode.vrr': [
    'mixed-usage.game-mode.vrr.2191',
    'mixed-usage.game-mode.vrr.2239'
  ],
  'mixed-usage.game-mode.resolutions': [
    'mixed-usage.game-mode.resolutions.18909',
    'mixed-usage.game-mode.resolutions.720p',
    'mixed-usage.game-mode.resolutions.107',
    'mixed-usage.game-mode.resolutions.125',
    'mixed-usage.game-mode.resolutions.33776',
    'mixed-usage.game-mode.resolutions.139',
    'mixed-usage.game-mode.resolutions.138',
    'mixed-usage.game-mode.resolutions.2219',
    'mixed-usage.game-mode.resolutions.12243',
    'mixed-usage.game-mode.resolutions.33777',
    'mixed-usage.game-mode.resolutions.8k30'
  ],
  'mixed-usage.direct-reflections.peak': [
    'mixed-usage.direct-reflections.peak'
  ],
  'mixed-usage.ambient-black.0lx': [
    'mixed-usage.ambient-black.0lx'
  ],
  'mixed-usage.ambient-black.1000lx': [
    'mixed-usage.ambient-black.1000lx'
  ]
};

function sortByIds(nodes: ScoreNode[], orderedIds: string[]): ScoreNode[] {
  const indexById = new Map(orderedIds.map((id, index) => [id, index]));
  return [...nodes].sort((left, right) => {
    const leftIndex = indexById.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = indexById.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });
}

export function getMainDimensionNodes(nodes: ScoreNode[] = rtingsRule.nodes): ScoreNode[] {
  return sortByIds(
    nodes.filter(node => node.parentId === rtingsRule.rootId),
    MAIN_DIMENSION_IDS
  );
}

export function collectNodesByDocumentOrder(nodes: ScoreNode[] = rtingsRule.nodes): ScoreNode[] {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const root = nodes.find(node => node.id === rtingsRule.rootId);
  if (!root) return [];

  const output: ScoreNode[] = [];
  function walk(node: ScoreNode) {
    output.push(node);
    getChildrenByDocumentOrder(node.id, nodes).forEach(walk);
  }
  void byId;
  walk(root);
  return output;
}

export function getChildrenByDocumentOrder(parentId: string, nodes: ScoreNode[] = rtingsRule.nodes): ScoreNode[] {
  const children = nodes.filter(node => node.parentId === parentId);
  const ordered = CHILD_ORDER[parentId] ?? LEAF_ORDER[parentId];
  return ordered ? sortByIds(children, ordered) : children;
}

export interface DocumentOrderLeaf {
  node: ScoreNode;
  parentLabel: string;
}

export function collectLeafItemsByDocumentOrder(parentId: string, nodes: ScoreNode[] = rtingsRule.nodes): DocumentOrderLeaf[] {
  const parent = nodes.find(node => node.id === parentId);
  return getChildrenByDocumentOrder(parentId, nodes).flatMap(child => {
    if (child.inputType === 'aggregate') {
      return collectLeafItemsByDocumentOrder(child.id, nodes);
    }
    return [{ node: child, parentLabel: parent?.label ?? '' }];
  });
}

export interface SubDimensionGroup {
  node: ScoreNode;
  items: DocumentOrderLeaf[];
}

export function collectSubDimensionGroups(groupId: string, nodes: ScoreNode[] = rtingsRule.nodes): SubDimensionGroup[] {
  const group = nodes.find(node => node.id === groupId);
  const children = getChildrenByDocumentOrder(groupId, nodes);
  const dimensions = children.filter(child => child.inputType === 'aggregate');
  const leafChildren = children.filter(child => child.inputType !== 'aggregate');

  if (!dimensions.length) {
    return group
      ? [{ node: group, items: collectLeafItemsByDocumentOrder(groupId, nodes) }]
      : [];
  }

  return [
    ...dimensions.map(dimension => ({
      node: dimension,
      items: collectLeafItemsByDocumentOrder(dimension.id, nodes)
    })),
    ...leafChildren.map(node => ({
      node,
      items: [{ node, parentLabel: group?.label ?? '' }]
    }))
  ];
}
