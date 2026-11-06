# Rtings 电视评分规则（融合版）

> **用途**：评分软件实现规范。融合工程师人工拆解（`Rtings计算文档.xlsx`）与 107 款 Rtings 实测数据反推（`rtings_data.csv`），每一项均标注证据等级。
> **证据等级**：
> - ✅ **A 实测验证**：用 CSV 中 107 款产品的官方得分逐款验证，误差 ≤0.1（= 显示精度）
> - 📊 **B 结构验证**：结构由数据证实，存在个别已知例外（见备注）
> - 📐 **C 工程师推定**：来自工程师人工拆解，CSV 无对应数据，无法数值验证
> - 👤 **D 主观评分**：无客观数据，人工打分

> 机器可读版：`Rtings评分规则.json`（与本文档同步）。

---

## 1. 总分结构（证据 A）

**Mixed Usage 总分 = 8 类加权平均**（用该权重验算 107 款：最大误差 0.050、平均 0.026，等于显示舍入精度）

| 分类目 | 权重 | 内部构成（证据） |
|---|---|---|
| Brightness 亮度 | **0.25** | HDR Brightness ×0.7 + SDR Brightness ×0.3 (A) |
| Black Level 黑位 | **0.22** | Contrast ×0.5 (A) + Black Uniformity ×0.3 (B) + Lighting Zone Precision ×0.2 (C) |
| Color 色彩 | **0.22** | HDR Color Volume ×0.4 (A) + SDR Color Volume ×0.3 (A) + SDR PreCal ×0.15 (A) + HDR PreCal ×0.15 (A) |
| Motion Handling 运动处理 | **0.10** | Judder ×0.32 + Stutter ×0.24 + Transition ×0.21 + RT ×0.17 + MicroJudder ×0.03 + LZT ×0.03 (B, 106/107≤0.05) |
| Processing 处理 | **0.07** | LQCS ×0.3 (A) + Upscaling ×0.3 (D) + PQ EOTF ×0.25 (A) + HDR Gradient ×0.15 (A) |
| Game Mode Responsiveness | **0.07** | ⚠️ 权重未能锁定（见 §3.6） |
| Direct Reflections 直射反射 | **0.05** | = Peak Direct Reflection Intensity ×1.0 (A) |
| Ambient Black Level Raise | **0.02** | = Black Luminance @1000lx ×1.0 (A) |

**通用聚合规则**（全部层级适用）：

1. score = Σ(wᵢ·子项分) / Σwᵢ(可用子项)——子项缺失时按权重重归一（renormalize）
2. **缺席判定**：原始值单元格为空且得分为 0 → 该子项"缺席"，从聚合中剔除（例：60Hz 电视无 4k@120 延迟数据）
3. 每级聚合后四舍五入到 0.1

---

## 2. 各分类目内部权重（自顶向下全展开）

### Brightness 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| HDR Brightness | 0.7 | 📊结构验证 |
| SDR Brightness | 0.3 | ✅实测验证 |

验证：n=107，最大误差 0.05

### SDR Brightness (child detail) 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| Real Scene Peak Brightness | 0.5 | ✅实测验证 |
| Peak 2% Window | 0.05 | ✅实测验证 |
| Peak 10% Window | 0.125 | ✅实测验证 |
| Peak 25% Window | 0.15 | ✅实测验证 |
| Peak 50% Window | 0.125 | ✅实测验证 |
| Peak 100% Window | 0.05 | ✅实测验证 |

验证：n=107，最大误差 0.05

### Black Level 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| Contrast | 0.5 | ✅实测验证 |
| Black Uniformity | 0.3 | 📊结构验证 |
| Lighting Zone Precision | 0.2 | 📐工程师推定 |

验证：n=107，最大误差 0.05

### Contrast (child detail) 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| Contrast with LD-ON | 0.8 | ✅实测验证 |
| Native Contrast (LD-OFF) | 0.2 | ✅实测验证 |

验证：n=107，最大误差 0.04

### Black Uniformity (child detail) 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| Std. Dev. (LD-ON) | 0.5 | ✅实测验证 |
| Native Std. Dev. | 0.5 | ✅实测验证 |

验证：n=107，最大误差 0.05

### Color 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| HDR Color Volume | 0.4 | ✅实测验证 |
| SDR Color Volume | 0.3 | ✅实测验证 |
| SDR Pre-Calibration Color Accuracy | 0.15 | ✅实测验证 |
| HDR Pre-Calibration Color Accuracy | 0.15 | ✅实测验证 |
| *分数存在但权重≈0 (反推), 工程师表未列* | | |
| *同上* | | |

验证：n=107，最大误差 0.05

### SDR Color Volume (child detail) 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| CIELAB DCI-P3 Coverage | 0.6 | ✅实测验证 |
| CIELAB BT.2020 Coverage | 0.4 | ✅实测验证 |

验证：n=107，最大误差 0.04

### HDR Color Volume (child detail) 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| 10 000 cd/m² BT.2020 Coverage ITP | 1 | ✅实测验证 |

验证：n=107，最大误差 0

### Pre/Post Calibration (child detail) 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| White Balance dE | 0.4 | ✅实测验证 |
| Color dE | 0.4 | ✅实测验证 |
| Color Temperature | 0.2 | ✅实测验证 |
| *SDR用dE 2000/CIELAB色温; HDR用dE ITP; Post-Cal结构同Pre-Cal* | | |

验证：n=107，最大误差 0.04

### Motion Handling 【📊结构验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| Judder | 0.32 | ✅实测验证 |
| Stutter | 0.24 | ✅实测验证 |
| Transition Artifacts | 0.21 | 📊结构验证 |
| Response Time | 0.17 | ✅实测验证 |
| Micro Judder | 0.03 | ✅实测验证 |
| Lighting Zone Transitions | 0.03 | 📐工程师推定 |

验证：n=107，最大误差 0.311，平均 0.029。106/107款误差≤0.05; 唯一例外 Samsung QN900F 8K (0.31, 无Transition子项)

> 工程师结构在107款上验证: 106款误差≤0.05, QN900F 8K例外0.31

### Judder (child detail) 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| Judder 24p | 0.1 | ✅实测验证 |
| Judder 25p | 0.1 | ✅实测验证 |
| Judder 24p via 60p | 0.2 | ✅实测验证 |
| Judder 25p via 60p | 0.2 | ✅实测验证 |
| Judder 24p via 60i | 0.2 | ✅实测验证 |
| Judder 24p via Native Apps | 0.1 | ✅实测验证 |
| Judder 25p via Native Apps | 0.1 | ✅实测验证 |

验证：n=107，最大误差 0

### Micro Judder (child detail) 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| Micro Judder-Free 24p | 0.15 | ✅实测验证 |
| Micro Judder-Free 25p | 0.15 | ✅实测验证 |
| via 60p 24p | 0.2 | ✅实测验证 |
| via 60p 25p | 0.2 | ✅实测验证 |
| via Native Apps 24p | 0.15 | ✅实测验证 |
| via Native Apps 25p | 0.15 | ✅实测验证 |
| *CSV中 native 24p 与 native 25p 两列数据恒同, 合计0.30* | | |

验证：n=107，最大误差 0

### Stutter (child detail) 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| Sample And Hold | 0.7 | ✅实测验证 |
| Frame Hold Time @ 24 fps | 0.3 | ✅实测验证 |

验证：n=107，最大误差 0.05

### Response Time (child detail) 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| First Response Time | 0.3 | ✅实测验证 |
| Total Response Time | 0.45 | ✅实测验证 |
| Worst 10% Response Time | 0.25 | ✅实测验证 |

验证：n=107，最大误差 0.05

### Transition Artifacts (child detail) 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| Color Artifacts | 0.7 | ✅实测验证 |
| Edge Artifacts | 0.3 | ✅实测验证 |

验证：n=106，最大误差 0.05

### Processing 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| Low-Quality Content Smoothing | 0.3 | ✅实测验证 |
| Upscaling: Sharpness Processing | 0.3 | 📐工程师推定 |
| PQ EOTF Tracking | 0.25 | ✅实测验证 |
| HDR Native Gradient | 0.15 | ✅实测验证 |

验证：n=107，最大误差 0.05

### PQ EOTF Tracking (child detail) 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| 600 Nit Tracking Delta | 0.1 | ✅实测验证 |
| 1000 Nit Tracking Delta | 0.8 | ✅实测验证 |
| 4000 Nit Tracking Delta | 0.1 | ✅实测验证 |

验证：n=107，最大误差 0.04

### HDR Native Gradient (child detail) 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| 100% Black→50% Gray | 0.125 | ✅实测验证 |
| 100% Black→50% Red | 0.125 | ✅实测验证 |
| 100% Black→50% Green | 0.125 | ✅实测验证 |
| 100% Black→50% Blue | 0.125 | ✅实测验证 |
| 50% Gray→100% White | 0.125 | ✅实测验证 |
| 50% Red→100% Red | 0.125 | ✅实测验证 |
| 50% Green→100% Green | 0.125 | ✅实测验证 |
| 50% Blue→100% Blue | 0.125 | ✅实测验证 |

验证：n=107，最大误差 0.05

### Game Mode Responsiveness 【📐工程师推定】

| 子项 | 权重 | 证据 |
|---|---|---|
| Input Lag | 0.25 | 📐工程师推定 |
| CAD @60Hz | 0.2 | 📐工程师推定 |
| CAD @120Hz | 0.2 | 📐工程师推定 |
| CAD @Max Refresh | 0.1 | 📐工程师推定 |
| Variable Refresh Rate | 0.15 | 📐工程师推定 |
| Supported Resolutions | 0.1 | 📐工程师推定 |

CSV 近似等效权重（若暂无 CAD@60 数据可用此版）：

| 子项 | 权重 |
|---|---|
| 8k@60Hz 延迟 | 0.24 |
| CAD @120Hz | 0.3 |
| CAD @Max | 0.11 |
| 4k@Max 延迟 | 0.1 |
| Supported Resolutions | 0.08 |
| VRR | 0.08 |
| 4k@120 延迟 | 0.08 |
| *近似解 (验证 max 0.506 / mean 0.096); 与工程师结构不一致, 待补测 CAD@60Hz 后重标定* |  |

验证：，最大误差 0.506，平均 0.096。CSV缺 CAD@60Hz 数据列, 工程师结构无法直接验证; 最佳近似解见下

> ⚠️ 唯一无法锁定权重的分类目. 建议软件实现时: 有CAD@60数据用工程师结构; 否则用CSV近似解

### Input Lag (child detail) 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| 1080p@60Hz | 0.05 | ✅实测验证 |
| 1080p@120Hz | 0.05 | ✅实测验证 |
| 1080p@Max | 0.1 | ✅实测验证 |
| 4k@60Hz | 0.1 | ✅实测验证 |
| 4k@60 4:4:4 | 0.1 | ✅实测验证 |
| 4k@120Hz | 0.2 | ✅实测验证 |
| 4k@Max | 0.4 | ✅实测验证 |

验证：n=107，最大误差 0.05

### CAD groups (child detail) 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| Avg. CAD | 0.6 | ✅实测验证 |
| Worst 10% CAD | 0.2 | ✅实测验证 |
| Best 10% CAD | 0.2 | ✅实测验证 |
| *三组(@60/@120/@Max)同构* | | |

验证：n=107，最大误差 0.04

### Variable Refresh Rate (child detail) 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| 4k VRR Maximum | 0.75 | ✅实测验证 |
| 1080p VRR Maximum | 0.25 | ✅实测验证 |
| *工程师权重验证 maxErr 0.05 精确成立 (99款有VRR)* | | |

验证：n=99，最大误差 0.05

### Supported Resolutions (child detail) 【📊结构验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| 480p ≡ 4k@60 (数据恒同) | 0.31 | 📊结构验证 |
| 1080p@60 4:4:4 ≡ 4k@60 4:4:4 | 0.32 | 📊结构验证 |
| 1080p@120 | 0.09 | 📊结构验证 |
| 1080p Max | 0.03 | 📊结构验证 |
| 4k@120 ≡ 4k@120 4:4:4 | 0.19 | 📊结构验证 |
| 4k Max | 0.02 | 📊结构验证 |
| 8k@60 | 0.04 | 📊结构验证 |
| *CSV多列数据完全相同(如480p与4k@60逐款得分一致), 反推权重为合并列的等效值* | | |

验证：n=107，最大误差 0.098，平均 0.014

### Direct Reflections 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| Peak Direct Reflection Intensity | 1 | ✅实测验证 |

验证：n=107，最大误差 0

### Ambient Black Level Raise 【✅实测验证】

| 子项 | 权重 | 证据 |
|---|---|---|
| Black Luminance @ 1000 lx | 1 | ✅实测验证 |
| *恒0分, 废弃* | | |

验证：n=107，最大误差 0

---

## 3. 叶子项评分规则

### 3.1 类别型映射（30 项，证据 A）

**标准二值**（Yes→10 / No→0，共 25 项）：

Local Dimming、Color Calibration、1080p @ 60Hz @ 4:4:4、4k @ 120Hz、4k @ 60Hz @ 4:4:4、4k @ 120Hz @ 4:4:4、8k @ 60Hz、FreeSync、4k @ 120Hz、1080p @ 120Hz、1440p @ 120Hz、4k @ 120Hz、1080p @ 120Hz、VRR、1440p @ 120Hz、VRR、Micro Judder-Free 25p、Micro Judder-Free 25p via 60p、Micro Judder-Free 25p via Native Apps、Micro Judder-Free 24p via 60p、Micro Judder-Free 24p via Native Apps

**非二值**：

| 测试 | 映射 |
|---|---|
| Screen Finish（test:53） | `Glossy`→10；`Matte`→10 |
| 480p @ 59.94Hz (Widescreen)（test:18909） | `Yes`→10 |
| 1080p @ 120Hz（test:125） | `Yes`→10；`No`→0；`Yes (Forced Resolution Required)`→10 |
| 4k @ 60Hz（test:139） | `Yes`→10 |
| Variable Refresh Rate（test:2190） | `Yes`→10；`Yes (except 43   50 )`→10；`No`→0 |
| 4k VRR Minimum（test:2192） | `< 20 Hz`→10；`48 Hz`→6.6；`No VRR support`→0；`40 Hz`→7 |
| 1080p VRR Minimum（test:2240） | `< 20 Hz`→10；`48 Hz`→6.6；`No VRR support`→0；`40 Hz`→7 |
| Auto Low Latency Mode (ALLM)（test:2642） | `Yes`→10 |
| Micro Judder-Free 24p（test:36112） | `Yes`→10 |

> 特例：`1080p @ 120Hz` 的 `Yes (Forced Resolution Required)` 计 10；`VRR` 的 `Yes (except 43/50")` 计 10；`White Balance Calibration` 任意点数(1~24点)→10，`No`→0。

### 3.2 恒等映射（19 项，证据 A）

得分 = 原始值（人工 0-10 评级）：

Smoothing、Detail Preservation、100% Black To 50% Gray、100% Black To 50% Red、100% Black To 50% Green、100% Black To 50% Blue、50% Gray To 100% White、50% Red To 100% Red、50% Green To 100% Green、50% Blue To 100% Blue、Judder 24p、Judder 25p、Judder 25p via 60p、Judder 24p via 60p、Judder 24p via 60i、Judder 24p via Native Apps、Judder 25p via Native Apps、Edge Artifacts、Color Artifacts

### 3.3 数值曲线（75 项，证据 A）

连续量的得分为单调平滑曲线（未公布解析公式）。**实现方式：线性插值锚点表即可复现官方得分（±0.1）**。观测范围外无数据支撑，外推需谨慎。方向：increasing=越大越好，decreasing=越小越好。

完整锚点表见 JSON（`leafScales.numericAnchors`，每项最多 30 个锚点）。抽样示例：

| 测试 | 方向 | 范围 | 锚点（值→分） |
|---|---|---|---|
| Hallway Lights (~1950 cd/m²)（test:12470） | ↑递增 | 185~2085 | 185→1.6，209→1.9，225.8→2，252.8→2.2，272→2.4，285→2.5，302.6→2.7，325.9→2.9 …共37点 |
| Peak 10% Window（test:461） | ↑递增 | 215~5060 | 215→2.4，274→3，286→3.1，297→3.2，306→3.3，354→3.8，367→3.9，423→4.5 …共37点 |
| Peak 100% Window（test:463） | ↑递增 | 137~993 | 137→2.8，149→3，156→3.1，194→3.7，216→4，226→4.1，258→4.6，276→4.8 …共37点 |
| White Balance dE 2000（test:150） | ↓递减 | 0.6~8.84 | 0.6→9.5，0.93→9.3，0.99→9.2，1.2→9.1，1.37→8.9，1.48→8.8，1.58→8.8，1.7→8.7 …共37点 |
| Sample And Hold（test:39752） | ↓递减 | 19.9~26.8 | 19.9→6.6，21.4→6.1，21.7→6，21.9→5.9，22.2→5.8，22.5→5.7，22.8→5.6，23→5.5 …共30点 |
| CIELAB DCI-P3 Coverage（test:28334） | ↑递增 | 62.75~99.98 | 62.75→5.1，70.05→5.8，72.06→6，77.21→6.6，78.34→6.7，80.79→7，82.09→7.1，82.58→7.2 …共37点 |

### 3.4 主观/半主观评分项（证据 D👤）

| 项目 | 说明 | 工程师锚点 |
|---|---|---|
| Upscaling: Sharpness Processing (test:112) | 工程师按默认状态锐化表现评级(参照 MTK9615/9618 平台表现); CSV仅提供最终得分, 无原始量 | 7分参照:TCL QM6K/Q77K (MTK9615)；8分参照:Sony X90L / Hisense UR8SG (MTK9618) |
| Black Uniformity (test:10) | ⚠️ 部分主观: Rtings 对黑场均匀性含人工判读(云雾/脏屏效应), CSV仅提供得分; 但其子项 Std.Dev 有客观量 | — |
| Local Dimming 算法表现 (Lighting Zone Transitions test:16977) | score-only, 无原始量; 工程师按光晕/过渡表现人工评分 | — |
| Lighting Zone Precision (test:16975) | score-only; 工程师以分区数量+算法评估 (65寸最低160区; 对标 Sony 480区 / Samsung 720区) | — |
| HDR Hallway/Landscape/Cityscape Photo (test:12656/12658/12657) | 照片对比评分项, CSV 107款全部无数据 (未启用) | — |

### 3.5 废弃/未启用项（10 项，不计分）

Black Uniformity Picture With Preferred Local Dimming（恒0分 (废弃指标)）、Gamma（恒0分 (废弃指标)）、Gamma（恒0分 (废弃指标)）、FreeSync（恒0分 (废弃指标)）、Black Luminance @ 0 lx（恒0分 (废弃指标)）、Native Black Uniformity Picture（无数据 (未启用)）、HDR Hallway Photo（无数据 (未启用)）、HDR Landscape Photo（无数据 (未启用)）、HDR Cityscape Photo（无数据 (未启用)）、Lighting Zone Precision Picture（无数据 (未启用)）

### 3.6 无法锁定的部分（重要）

- **Game Mode Responsiveness 内部权重**：工程师结构含 CAD@60Hz（w=0.2），CSV 无该数据列。工程师权重在 107 款上验证误差 max 1.5 分 → **无法证实**；CSV 近似解（max 0.506 / mean 0.096）也非精确。软件实现建议：先用工程师结构，自测数据积累后回归校准。
- **HDR Brightness 的 Yellow Skyscraper 与 ABL 子项**：CSV 无数据。已验证的 6 列等效权重（Hallway .2 / Landscape .31 / P2% .41 / P100% .08）仅在"只有这 4 列"时可用。
- **4 个 score-only 聚合**（Lighting Zone Transitions、Contrast And Dark Details In Game Mode、Stutter Reduction Via Interpolation、Transition Artifacts 之外的原始量）：Transition 已破解（=Color×0.7+Edge×0.3）；其余 3 个无子项数据，权重未知。

---

## 4. 7分/8分目标门槛（工程师表）与数据核对

> 用于设定产品目标。✅=门槛代入 CSV 曲线得分精确 7/8；括号内为代入后的实际得分。

**HDR Brightness**

| 子项 | ≥7 分 | ≥8 分 | 核对 |
|---|---|---|---|
| Hallway (~1950) | 880 | 1150 | ≥7值实际对应6.93分(CSV外推); ≥8对应8.07 |
| Yellow Skyscraper | 384 | 450 | CSV无此测试列 |
| Landscape Pool | 165 | 197 | ≥7对应6.92; ≥8对应7.97 |
| Peak 2% | 818 | 1200 | 精确7.00/8.00 |
| Peak 10% | 840 | 1200 | 精确 |
| Peak 25% | 667 | 950 | 7.00/7.99 |
| Peak 50% | 600 | 820 | 精确 |
| Peak 100% | 560 | 840 | 6.90/7.98 (略偏) |

**SDR Brightness**

| 子项 | ≥7 分 | ≥8 分 | 核对 |
|---|---|---|---|
| Real Scene Peak | 450 | 590 | 7.01/7.99 |
| Peak 2%~100% | 450 | 580 | 2%/25%/50%/100%档CSV精确; 10%档CSV门槛448 |

**Contrast**

| 子项 | ≥7 分 | ≥8 分 | 核对 |
|---|---|---|---|
| Contrast LD-ON | 58400:1 | 110000:1 | 7.00/8.01 精确 |
| Native Contrast | 4426 | 6500 | 7.00/7.97 |

**Black Uniformity**

| 子项 | ≥7 分 | ≥8 分 | 核对 |
|---|---|---|---|
| Std. Dev. | ≤0.78% | ≤0.53% | 7.00/7.96 精确 |
| Native Std. Dev. | ≤0.756% | ≤0.524% | 7.00/8.00 精确 |

**Color**

| 子项 | ≥7 分 | ≥8 分 | 核对 |
|---|---|---|---|
| DCI-P3 | ≥80.5% | ≥88.38% | 7.00/8.00 精确 |
| BT.2020 (SDR CV子项) | ≥70% | ≥80% | 7.00/8.04 |
| 10000nit BT.2020 ITP | ≥31% | ≥39.7% | 6.97/8.00 精确 |
| WB dE (SDR) | ≤3.45 | ≤2.5 | 6.97/8.00 |
| Color dE (SDR) | ≤3.45 | ≤2.5 | 7.02/— |
| 色温 | 6100~6900K | 6400~6700K | CSV为6500K对称衰减: 7分带≈6206~6810K, 8分带≈6310~6694K; 工程师区间略宽 |
| HDR dE ITP | ≤12 | ≤7.64 | 6.90~6.94/7.98~8.00 |

**Motion**

| 子项 | ≥7 分 | ≥8 分 | 核对 |
|---|---|---|---|
| Sample And Hold | ≤18.5 px/s | ≤17 px/s | CSV最高6.6分@19.9; ≤7分无样本, 为外推目标 |
| Frame Hold 24fps | ≤34.2ms | ≤28ms | 7.00/8.00 精确 |
| First RT | ≤7.5ms | ≤6.2ms | 7.20/8.00 |
| Total RT | ≤16ms | ≤12ms | 7.03/8.05 |
| Worst 10% RT | ≤24.9ms | ≤17.8ms | 7.00/8.00 精确 |
| 1080p@60 | ≤16.7ms | ≤13.6ms | 7.10/8.00 |
| 1080p@120 | ≤11.6ms | ≤8.8ms | ≈7.15/— |
| 4k@120 | ≤11.6ms | ≤8.8ms | 7.16/8.01 |
| 4k@Max | ≤11.6ms | ≤8.8ms | 7.08/7.68 ⚠️ 8分门槛偏严, 8分实际需~7ms |
| Avg. CAD | ≤196 | ≤131 | 7.00/8.07 |
| Best CAD | ≤112 | ≤70 | 7.00/— |
| Worst CAD | ≤360 | ≤260 | 6.90/— |

**Reflections**

| 子项 | ≥7 分 | ≥8 分 | 核对 |
|---|---|---|---|
| Peak Direct Reflection | ≤35% | ≤23.5% | 7.00/8.08 精确 |
| Black Luminance @1000lx | ≤1.62 | ≤0.98 | 6.99/8.00 精确 |

> ⚠️ 重点提醒：**4k@Max ≥8 分门槛 8.8ms 偏严**（CSV 曲线该处约 7.7 分，8 分需 ~7ms）；**10 分档门槛普遍偏宽**（HDR P2% 7700 vs 实际 10841、SDR P2% 7000 vs 实际 11310、Hallway 1850 vs 2085、LD-ON 对比度 45万 vs 45.9万）。

---

## 5. 软件实现注意事项

1. **单位**：黑场 Std. Dev./Native Std. Dev. 的 CSV 值为百分数（1.857 = 1.857%）；实验室若输出小数（0.01857）需 ×100。Contrast 为比值（58400，非 "n:1" 字符串）。
2. **缺席 vs 0 分**：不支持的模式（原始值空+得分0）必须从聚合剔除并 renormalize——这是从 60Hz 机型残差确认的机制，不做会导致低配产品被系统性压低 2+ 分。
3. **数据恒同列**：CSV 中 480p≡4k@60、1080p@60 4:4:4≡4k@60 4:4:4、4k@120≡4k@120 4:4:4、native 24p/25p（Micro Judder）逐款得分完全相同，等效权重已合并给出。
4. **锚点插值**：数值曲线用线性插值锚点实现即可；不要自行拟合幂/对数函数（不可唯一确定）。
5. **主观项**：Upscaling 等 D 级项按工程师锚点打分（7分≈MTK9615 表现、8分≈MTK9618/Sony X90L 级）。
---

## 6. 数据来源与证据声明

1. **A 级结论**全部可由 `rtings_data.csv` 复算：聚合行用 (子项得分×权重)/Σ权重 对比父项分；曲线锚点直接来自 (原始值→得分) 散点。
2. **C 级结论**来自 `Rtings计算文档.xlsx` 工程师拆解（权重树、得分范围、7/8 分门槛），其中分类目权重、Contrast/Input Lag/VRR/Stutter/RT/Judder 等子项权重已被 A 级验证覆盖；无法验证的部分（CAD@60、Yellow Skyscraper、ABL、视角、灰阶均匀性、8k@30/24）已逐项列出。
3. **本文件不含任何编造数值**：所有权重/门槛/锚点要么来自 CSV 反推（附验证误差），要么来自工程师表（附证据等级）；推断处均标注推理依据。
4. 局限：CSV 仅 107 款、方法版本混合（v2.3.1×97 / v2.2×9 / v2.1×1）；两端稀疏区锚点密度低；Rtings 未来调整曲线会使锚点失效，建议定期用最新数据重校。
