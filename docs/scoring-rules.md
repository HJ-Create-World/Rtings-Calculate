# Rtings 评分规则拆解

状态：首次只读拆解完成，待工程师确认歧义。来源：`C:\Users\15056\Desktop\Rtings计算文档.xlsx`，源文件未修改或保存。

证据口径：“明示”均可由单元格或公式直接证明；“建议”是软件化方案，不是已确认业务规则。除特别说明外，行号以 `000003 得分计算表格` 为准。

## 1. Sheet 清单与用途【明示】

| Sheet                       | 用途                                                  |
| --------------------------- | --------------------------------------------------- |
| 000001 Rtings评测拆解           | 评分树、权重、7/8 分目标值、示例和测试说明；仅 Y3:Y10、Y17:Y18 有 IFS 示例公式 |
| 000002 得分范围统计               | 客观项的分数→实测样本/预估区间查找表；A4:A96 为 0.8~10.0、步长 0.1，无公式    |
| 000003 得分计算表格               | 5 个产品/场景的完整加权计算；190 个公式，是主要聚合基准                     |
| 000004 Rtings测试标准要求         | 选机、校准、暗室、仪器等方法学说明，不是结构化评分规则                         |
| 000005 Hisense-65U7N\&Vizio | 4 个产品/实测场景对比；151 个公式，数据版本与 000003 不同                |
| 000006 20260907-实测          | SDR/HDR 原始 xy/Lv、设置和对比度测量；含 20 个对比度公式               |
| 000007 CAD                  | 65U7N 在 60/120/Max Hz 下 Avg/Best10%/Worst10% 数据，无公式 |
| 000008 Response Time        | 传感器、测试 PC、被测电视的设备说明，无公式                             |

全工作簿未发现 `#REF!`、`#VALUE!`、`#NAME?`、`#DIV/0!` 等公式错误。

## 2. Mixed Usage 层级与权重【明示】

| 顶层组                       | 顶层权重 | 下一层权重与行范围                                                                                                      |
| ------------------------- | ---: | -------------------------------------------------------------------------------------------------------------- |
| Brightness                |  25% | HDR 70%（3:10）；SDR 30%（17:22）；Sustained/ABL 当前不进公式                                                              |
| Black Level               |  22% | Contrast 50%（LD-ON 80%、Native 20%）；Black Uniformity 30%；Lighting Zone Precision 20%                            |
| Color                     |  22% | HDR Color Volume 40%；SDR Color Volume 30%；SDR/HDR Pre Calibration 各 15%                                        |
| Processing                |   7% | Low-quality Smoothing 30%；Upscaling 30%；PQ EOTF 25%；HDR Native Gradient 15%                                    |
| Motion Handling           |  10% | Judder 32%；Stutter 24%；Transition Artifacts 21%；Response Time 17%；Micro Judder 3%；Lighting Zone Transitions 3% |
| Game Mode Responsiveness  |   7% | Input Lag 25%；CAD@60/120 各 20%；CAD@Max 10%；VRR 15%；Supported Resolutions 10%                                   |
| Direct Reflections        |   5% | Peak Direct Reflection Intensity 100%                                                                          |
| Ambient Black Level Raise |   2% | 0lx 为 0；1000lx 为 100%                                                                                          |
| Panel                     |   NA | Viewing Angle（110:114）、Gray Uniformity（115:118）单独展示，不进 Mixed Usage                                             |

计入总分的顶层权重和为 1。详细叶子行与权重保留在源表，软件建模时必须逐行配置，不能只凭“权重是否为数值”判断是否计分。

## 3. 当前真实计算链【明示】

1. 每个产品块依次保存组分、维度分、叶子分、原始值，如 G/H/I/J；其余产品块为 K/L/M/N 等。
2. 叶子→维度使用 `SUMPRODUCT`，例如 `H3=SUMPRODUCT(F3:F10,I3:I10)`、`H29=SUMPRODUCT(F29:F30,I29:I30)`。
3. 维度→组例如 `G3=D3*H3+D17*H17`、`G29=SUMPRODUCT(D29:D33,H29:H33)`。
4. 组→总分例如 `G2=SUMPRODUCT($B$3:$B$109,G3:G109)`，范围到 109，因此 Panel 被排除。
5. 单叶子节点可直接引用，如 `H33=I33`、`G107=H107`；Ambient Black Level 为 `G108=H109`。
6. 主计算页叶子分数是常量，没有引用 `000002 得分范围统计`。所以当前是“人工换算/录入叶子分→自动聚合”，不是“原始值自动映射→自动聚合”。
7. 聚合没有除以权重和，也没有 `ROUND`；内部保留全精度，显示格式为 1 位小数。中间层不应提前四舍五入。

## 4. NA、零权重与特例【明示】

| 位置                   | 现象                                                 | 软件化注意              |
| -------------------- | -------------------------------------------------- | ------------------ |
| F11:F15、F23:F27      | Sustained 权重 NA                                    | 保留测试记录，不参与当前父项公式   |
| F16=0.175、F28=0.075  | ABL 有数值权重，但分数 NA，且公式范围排除对应行                        | 不能按数值权重自动纳入        |
| F77=NA               | `H77=I77`，Lighting Zone Transitions 仍以维度分进入 Motion | NA 不等于全局剔除         |
| F108=0、D108=0        | 0lx 不计，`G108=H109` 仅取 1000lx                       | 零权重与 NA 分开建模       |
| E77/E107/E108/E109 等 | 叶子名为 NA                                            | 可表示没有更细叶子，不代表维度分无效 |
| J43 等                | 原始值 NA 但叶子有主观分                                     | 不能因原始值缺失而删除已有评分    |
| B110、D110、D115       | Panel 权重 NA                                        | Panel 独立计算/展示，不进总分 |

建议显式建模 `includeInParent`、`scoreSource`、`inputLevel`，不要依赖 Excel 对文本的隐式零值行为。

## 5. 客观项区间覆盖【明示】

`000002` 每个项目通常有“Rtings 实测值/预估范围”两列。实测格可能是多个值、范围或 `inf`，应视为证据样本，不可直接当计算区间。缺口均相对 0.8~10.0 的 93 个分数档。

| 测试项（列）                          | 实测覆盖               | 预估缺口               |
| ------------------------------- | ------------------ | ------------------ |
| HDR Hallway B/C                 | 1.7~10             | 0.8~1.6            |
| HDR Yellow Skyscraper D/E       | 3.5~10             | 0.8~1.6            |
| HDR Landscape Pool F/G          | 5.6~10             | 0.8~1.6            |
| HDR Peak 2% H/I                 | 2.3~10             | 0.8~1.6            |
| HDR Peak 10% J/K                | 2.4~9.6            | 0.8~1.6            |
| HDR Peak 25% L/M                | 3.2~9.4            | 0.8~1.6            |
| HDR Peak 50% N/O                | 3.9~9.2            | 0.8~2.9            |
| HDR Peak 100% P/Q               | 2.9~8.5            | 0.8~1.9            |
| SDR Real Scene R/S              | 4.6~9.5            | 0.8~1.9            |
| SDR Peak 2% T/U                 | 3.4~10             | 0.8~1.9            |
| SDR Peak 10% V/W                | 4.8~9.8            | 0.8~2.9            |
| SDR Peak 25% X/Y                | 4.8~9.7            | 0.8~2.9            |
| SDR Peak 50% Z/AA               | 4.8~9.5            | 0.8~2.9            |
| SDR Peak 100% AB/AC             | 3.7~9.2            | 0.8~2.9            |
| Contrast LD-ON AD/AE            | 0.8~10             | 无                  |
| Native Contrast AF/AG           | 3.9~10，10 分实测为 inf | 0.8~~3.0、9.2~~10.0 |
| Black Uniformity Std.Dev. AI/AJ | 5.0~10             | 0.8~3.9            |
| Native Std.Dev. AK/AL           | 3.6~10             | 0.8~2.9            |
| SDR Color Volume DCI-P3 AM/AN   | 5.1~10             | 0.8~3.9            |
| SDR Color Volume BT.2020 AO/AP  | 4.2~6.1            | 预估整列空，缺 0.8~10.0   |
| Lighting Zone Precision AH      | 仅两个产品名，无数值区间       | 无法形成计算规则           |

评分树中的 HDR Color Volume、Pre Calibration、PQ EOTF、Stutter、Response Time、Input Lag、CAD、VRR、Direct Reflection、Ambient Black Level，以及 Panel 项目，当前也没有完整换算表。工程师已确认：无映射表项目按主观评分处理。

## 6. 异常与已确认口径

1. Supported Resolutions 的 F96:F106 权重和为 **1.0004**。已确认软件采用“兼容 Excel 原样、不归一化”：结果保留该微小偏差，同时在规则校验中显示权重和异常警告。
2. 五处区间重叠：Y93/Y94、AA93/AA94、AJ78/AJ79、AL78/AL79、AN55/AN56。工程师反馈已修改；首次拆解读取仍为旧值，修改后版本尚未完成重新核对，核对通过前不得当作已修正。
3. AJ/AL 的 0.595% 上限疑似笔误；AN55/AN56 重叠 0.10 个百分点，状态同上。
4. `000001 Y4` 含 `AND(Z4>=210,Z4<205)`，永不成立；且 210~490 无映射。该 IFS 示例不能作为软件规则来源。
5. `000001 K109` 为“≤0.98 cd/m131”，单位/尾部疑似损坏，仍待提供正确文本。
6. 不同 Sheet 的产品数据版本不同，不可把总分混合作为同一基准。

## 7. 回归基准【已确认】

权威基准是 `000005 Hisense-65U7N&Vizio` 中 **“Hisense 65U7N-Rtings实际评测值(VA)”** 产品块：

- 当前总分 `G2=7.44607754`。
- 该块的输入值、各层中间分和总分应作为黄金回归用例。

`000003` 的 5 个结果仅作“叶子分→聚合”兼容性辅助参考：G2=7.59258692、K2=7.97895088、O2=7.94447588、S2=7.95327588、W2=8.48300577。它们不是权威基准，不能替代 000005 的 VA 块。

## 8. 已确认软件口径

- 配置化评分 DAG：稳定 ID、层级、权重、是否计入父项、输入类型、单位、方向、规则版本。
- 聚合保持 Excel 原样：`SUMPRODUCT` 不除以权重和；中间层全精度，展示层 1 位小数。
- 区间边界统一“下含上不含”；10.0 分表示 `>=` 某个开放上界。
- `inf` 表示无穷大；只实现已有区间；无法评分标为“不完整”，不插值、不外推、不补零。
- ABL 与 Lighting Zone Transitions 均按主观评分建模：ABL 不计入计算；Lighting Zone Transitions 计入 3%。
- 无映射表项目按主观评分处理；主观分范围 0~10，支持一位小数。
- 实测样本只作为评分证据，不自动生成预估区间；工程师区间与实测样本分离存储。
- 追踪链保存：原始输入→命中区间/规则版本→叶子分→权重与贡献→维度分→组分→总分。
- 为 ABL、Lighting Zone Transitions、Panel、1.0004 权重和、NA 状态建立专项测试；五处区间修正后补充对应用例。

规则状态明细见 `requirements.md` 的 R01~R09。
