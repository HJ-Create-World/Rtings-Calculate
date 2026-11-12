export interface ReferenceValues {
  seven: string;
  eight: string;
}

/**
 * 7/8 分参考值来自《Rtings计算文档.xlsx》Rtings评测拆解 sheet：
 * H 列“分数范围”、I 列“得分超过7分需要数值”、J 列“得分超过8分需要数值”。
 * 表格中为空白的项保留 “—”；表格中为 NA 的项显示 “NA”。
 */
export const rtingsReferences: Record<string, ReferenceValues> = {
  'mixed-usage.brightness.hdr.hallway': { seven: '880', eight: '1150' },
  'mixed-usage.brightness.hdr.yellow': { seven: '384', eight: '450' },
  'mixed-usage.brightness.hdr.landscape': { seven: '165', eight: '197' },
  'mixed-usage.brightness.hdr.peak2': { seven: '818', eight: '1200' },
  'mixed-usage.brightness.hdr.peak10': { seven: '840', eight: '1200' },
  'mixed-usage.brightness.hdr.peak25': { seven: '667', eight: '950' },
  'mixed-usage.brightness.hdr.peak50': { seven: '600', eight: '820' },
  'mixed-usage.brightness.hdr.peak100': { seven: '560', eight: '840' },
  'mixed-usage.brightness.hdr.abl': { seven: 'NA', eight: 'NA' },
  'mixed-usage.brightness.sdr.619': { seven: '450', eight: '590' },
  'mixed-usage.brightness.sdr.609': { seven: '450', eight: '580' },
  'mixed-usage.brightness.sdr.610': { seven: '450', eight: '580' },
  'mixed-usage.brightness.sdr.611': { seven: '450', eight: '580' },
  'mixed-usage.brightness.sdr.612': { seven: '450', eight: '580' },
  'mixed-usage.brightness.sdr.613': { seven: '450', eight: '580' },

  'mixed-usage.black-level.contrast.ld-on': { seven: '58,400:1', eight: '110,000:1' },
  'mixed-usage.black-level.contrast.native': { seven: '4,426:1', eight: '6,500:1' },
  'mixed-usage.black-level.uniformity.641': { seven: '≤0.78%', eight: '≤0.53%' },
  'mixed-usage.black-level.uniformity.130': { seven: '≤0.756%', eight: '≤0.524%' },
  'mixed-usage.black-level.zone-precision': {
    seven: '分区最低要求 160（65"）',
    eight: 'SONY 7II-480区；三星-720区（65"）'
  },

  'mixed-usage.color.hdr-volume.itp': { seven: '≥31%', eight: '≥39.7%' },
  'mixed-usage.color.sdr-volume.28334': { seven: '≥80.5%', eight: '≥88.38%' },
  'mixed-usage.color.sdr-volume.28336': { seven: '≥70%', eight: '≥80%' },
  'mixed-usage.color.sdr-precal.150': { seven: '≤3.45', eight: '≤2.5' },
  'mixed-usage.color.sdr-precal.154': { seven: '≤3.45', eight: '≤2.5' },
  'mixed-usage.color.sdr-precal.1937': { seven: '6100K≤△E≤6900K', eight: '6400K≤△E≤6700K' },
  'mixed-usage.color.hdr-precal.29345': { seven: '≤12', eight: '≤7.64' },
  'mixed-usage.color.hdr-precal.29346': { seven: '≤12', eight: '≤7.64' },
  'mixed-usage.color.hdr-precal.29347': { seven: '6100K≤△E≤6900K', eight: '6400K≤△E≤6700K' },
  'mixed-usage.color.sdr-postcal': { seven: '—', eight: '—' },
  'mixed-usage.color.hdr-postcal': { seven: '—', eight: '—' },

  'mixed-usage.processing.smoothing.18015': {
    seven: 'TCL QM6K/Q77K（MTK9615）',
    eight: 'Sony X90L/Hisense UR8SG'
  },
  'mixed-usage.processing.smoothing.18016': { seven: '—', eight: '—' },
  'mixed-usage.processing.upscaling': { seven: '（MTK9615）', eight: '（MTK9618）' },
  'mixed-usage.processing.pq-eotf.13904': { seven: '≤0.0083', eight: '≤0.0052' },
  'mixed-usage.processing.pq-eotf.13905': { seven: '≤0.0083', eight: '≤0.0052' },
  'mixed-usage.processing.pq-eotf.13906': { seven: '≤0.0083', eight: '≤0.0052' },
  'mixed-usage.processing.gradient.18399': { seven: 'NA', eight: '—' },
  'mixed-usage.processing.gradient.18400': { seven: '—', eight: '—' },
  'mixed-usage.processing.gradient.18401': { seven: 'NA', eight: '—' },
  'mixed-usage.processing.gradient.18402': { seven: '—', eight: '—' },
  'mixed-usage.processing.gradient.18403': { seven: 'NA', eight: '—' },
  'mixed-usage.processing.gradient.18404': { seven: '—', eight: '—' },
  'mixed-usage.processing.gradient.18405': { seven: 'NA', eight: '—' },
  'mixed-usage.processing.gradient.18406': { seven: '—', eight: '—' },

  'mixed-usage.motion.judder.36315': {
    seven: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率',
    eight: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率'
  },
  'mixed-usage.motion.judder.36316': {
    seven: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率',
    eight: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率'
  },
  'mixed-usage.motion.judder.36313': {
    seven: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率',
    eight: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率'
  },
  'mixed-usage.motion.judder.36314': {
    seven: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率',
    eight: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率'
  },
  'mixed-usage.motion.judder.36317': {
    seven: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率',
    eight: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率'
  },
  'mixed-usage.motion.judder.36318': {
    seven: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率',
    eight: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率'
  },
  'mixed-usage.motion.judder.36319': {
    seven: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率',
    eight: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率'
  },
  'mixed-usage.motion.stutter.39752': { seven: '18.5 pixel/second', eight: '17 pixel/second' },
  'mixed-usage.motion.stutter.1925': { seven: '≤34.2ms', eight: '≤28ms' },
  'mixed-usage.motion.transition.39013': { seven: 'NA', eight: 'NA' },
  'mixed-usage.motion.transition.39027': { seven: 'NA', eight: 'NA' },
  'mixed-usage.motion.response-time.30862': { seven: '≤7.5ms', eight: '≤6.2ms' },
  'mixed-usage.motion.response-time.30860': { seven: '≤16ms', eight: '≤12ms' },
  'mixed-usage.motion.response-time.30861': { seven: '≤24.9ms', eight: '≤17.8ms' },
  'mixed-usage.motion.micro-judder.36112': {
    seven: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率',
    eight: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率'
  },
  'mixed-usage.motion.micro-judder.36113': {
    seven: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率',
    eight: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率'
  },
  'mixed-usage.motion.micro-judder.36114': {
    seven: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率',
    eight: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率'
  },
  'mixed-usage.motion.micro-judder.36115': {
    seven: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率',
    eight: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率'
  },
  'mixed-usage.motion.micro-judder.36116': {
    seven: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率',
    eight: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率'
  },
  'mixed-usage.motion.micro-judder.36117': {
    seven: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率',
    eight: 'SOC：支持120Hz-MEMC；OC：支持120Hz刷新率'
  },
  'mixed-usage.motion.zone-transitions': { seven: 'NA', eight: 'NA' },

  'mixed-usage.game-mode.input-lag.25': { seven: '≤16.7ms', eight: '≤13.6ms' },
  'mixed-usage.game-mode.input-lag.1466': { seven: '≤11.6ms', eight: '≤8.8ms' },
  'mixed-usage.game-mode.input-lag.12237': { seven: '≤11.6ms', eight: '≤8.8ms' },
  'mixed-usage.game-mode.input-lag.542': { seven: '≤16.7ms', eight: '≤13.6ms' },
  'mixed-usage.game-mode.input-lag.543': { seven: '≤16.7ms', eight: '≤13.6ms' },
  'mixed-usage.game-mode.input-lag.2194': { seven: '≤11.6ms', eight: '≤8.8ms' },
  'mixed-usage.game-mode.input-lag.12239': { seven: '≤11.6ms', eight: '≤8.8ms' },
  'mixed-usage.game-mode.cad-60.avg': { seven: '≤196', eight: '≤131（预估）' },
  'mixed-usage.game-mode.cad-60.best': { seven: '≤112', eight: '≤70（预估）' },
  'mixed-usage.game-mode.cad-60.worst': { seven: '≤360', eight: '≤260（预估）' },
  'mixed-usage.game-mode.cad-120.30878': { seven: '≤196', eight: '≤131（预估）' },
  'mixed-usage.game-mode.cad-120.30879': { seven: '≤112', eight: '≤70（预估）' },
  'mixed-usage.game-mode.cad-120.30880': { seven: '≤360', eight: '≤260（预估）' },
  'mixed-usage.game-mode.cad-max.30870': { seven: '≤196', eight: '≤131（预估）' },
  'mixed-usage.game-mode.cad-max.30871': { seven: '≤112', eight: '≤70（预估）' },
  'mixed-usage.game-mode.cad-max.30872': { seven: '≤360', eight: '≤260（预估）' },
  'mixed-usage.game-mode.vrr.2191': { seven: '根据具体支持情况', eight: '根据具体支持情况' },
  'mixed-usage.game-mode.vrr.2239': { seven: '根据具体支持情况', eight: '根据具体支持情况' },
  'mixed-usage.game-mode.resolutions.18909': {
    seven: '支持=10；不支持=0（需 SOC/OC 支持）',
    eight: '支持=10；不支持=0（需 SOC/OC 支持）'
  },
  'mixed-usage.game-mode.resolutions.720p': {
    seven: '支持=10；不支持=0（需 SOC/OC 支持）',
    eight: '支持=10；不支持=0（需 SOC/OC 支持）'
  },
  'mixed-usage.game-mode.resolutions.107': {
    seven: '支持=10；不支持=0（需 SOC/OC 支持）',
    eight: '支持=10；不支持=0（需 SOC/OC 支持）'
  },
  'mixed-usage.game-mode.resolutions.125': {
    seven: '支持=10；不支持=0（需 SOC/OC 支持）',
    eight: '支持=10；不支持=0（需 SOC/OC 支持）'
  },
  'mixed-usage.game-mode.resolutions.33776': {
    seven: '支持=10；不支持=0（需 SOC/OC 支持）',
    eight: '支持=10；不支持=0（需 SOC/OC 支持）'
  },
  'mixed-usage.game-mode.resolutions.139': {
    seven: '支持=10；不支持=0（需 SOC/OC 支持）',
    eight: '支持=10；不支持=0（需 SOC/OC 支持）'
  },
  'mixed-usage.game-mode.resolutions.138': {
    seven: '支持=10；不支持=0（需 SOC/OC 支持）',
    eight: '支持=10；不支持=0（需 SOC/OC 支持）'
  },
  'mixed-usage.game-mode.resolutions.2219': {
    seven: '支持=10；不支持=0（需 SOC/OC 支持）',
    eight: '支持=10；不支持=0（需 SOC/OC 支持）'
  },
  'mixed-usage.game-mode.resolutions.12243': {
    seven: '支持=10；不支持=0（需 SOC/OC 支持）',
    eight: '支持=10；不支持=0（需 SOC/OC 支持）'
  },
  'mixed-usage.game-mode.resolutions.33777': {
    seven: '支持=10；不支持=0（需 SOC/OC 支持）',
    eight: '支持=10；不支持=0（需 SOC/OC 支持）'
  },
  'mixed-usage.game-mode.resolutions.8k30': {
    seven: '支持=10；不支持=0（需 SOC/OC 支持）',
    eight: '支持=10；不支持=0（需 SOC/OC 支持）'
  },

  'mixed-usage.direct-reflections.peak': { seven: '≤35%', eight: '≤23.5%' },
  'mixed-usage.ambient-black.0lx': { seven: '0', eight: '0' },
  'mixed-usage.ambient-black.1000lx': { seven: '≤1.62 cd/m²', eight: '≤0.98 cd/m²' }
};

export function getReferenceValues(nodeId: string): ReferenceValues {
  return rtingsReferences[nodeId] ?? { seven: '—', eight: '—' };
}
