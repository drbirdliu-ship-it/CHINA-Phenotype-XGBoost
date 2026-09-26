# 两套 CHINA 分型模型：年龄修正后的更新版

当前模型版本：`2026-09-26-age-corrected`。之前的模型权重已作废。

本包包含紫色 11 变量模型和天蓝色 9 变量模型的网页代码、已训练模型、训练和验证脚本。
GitHub 仓库：https://github.com/drbirdliu-ship-it/CHINA-Phenotype-XGBoost
作者、版权持有者、许可证和 Zenodo DOI 信息待补充。`publication/` 中的文件仅为未启用模板，尚未发布正式软件 Release 或创建 Zenodo 归档。

## 公开网页

- 11变量紫色版：https://china-phenotype-xgboost.christopherleenmu.chatgpt.site
- 9变量天蓝色版：https://china-phenotype-9.christopherleenmu.chatgpt.site

原网址保持不变，线上模型已替换。已安装的离线应用需要联网重开，确认出现“Updated 26 September 2026”。
GitHub 历史提交仅保留用于追溯，不应使用旧模型继续分析。

## 先试运行

解压后，在本文件所在目录打开终端，执行：

```sh
python -m http.server 8000 --bind 127.0.0.1 --directory docs
```

在运行命令的同一台电脑打开 `http://127.0.0.1:8000/`。保持终端窗口开启。
Windows 如使用 Python 启动器，可将 `python` 换成 `py -3`；Mac 可使用 `python3`。
进入任一模型，点击 Load example，再点击 Calculate phenotype。
网页预测不需要重新训练，也不需要患者原始数据。

## 公开什么

- 两套完整网页及已经训练好的模型，能够直接计算四个分型的概率。
- 完整特征顺序、模型参数、固定数据划分方法和重训练脚本。
- 原始模型评价结果和浏览器/Python 一致性检查。
- 英文 README、变量单位与编码表、引用及论文 Code availability 模板。

本包不包含患者原始数据、逐例预测结果、账号密钥或托管平台内部配置。
公开源码及模型后，读者可以运行预测；重新得到训练结果仍需要获准使用原始研究数据。
数据共享声明应另按本研究的实际伦理和机构安排填写。

## 正式发表前补齐

1. 已确定 GitHub 仓库：`drbirdliu-ship-it/CHINA-Phenotype-XGBoost`。
2. 软件作者的英文姓名、顺序、单位；有 ORCID 可一并填写。
3. 代码及模型版权持有者和拟使用的许可证。MIT 仅为建议稿，尚未生效。
4. 对应稿件题目和版本号；期刊如有更具体的代码要求，请按其说明调整。

将填写完成的引用文件移至仓库根目录，删除 `.example` 后缀；许可证确认后才生成 `LICENSE`。
不要把模板中的 `TO_BE_COMPLETED` 等占位文字作为正式作者或 DOI 发布。

## GitHub 与 Zenodo 的关系

GitHub 用于公开、查看和维护代码。Zenodo 对具体 release 归档并提供 DOI。
建议将两套模型放在同一个仓库中，以 `v1.0.0` 作为共同首发版本，让一个 DOI 对应完整的软件包。
Zenodo DOI 对应代码存档，网页运行地址仍需 GitHub Pages、现有托管平台或其他服务器提供。

操作顺序：完善作者和许可证 → 公开 GitHub 仓库 → 连接 Zenodo 并启用该仓库 →
发布正式 GitHub Release → 检查 Zenodo 归档和 DOI → 在论文中填写仓库网址及版本 DOI。
详细步骤与官方链接见 `documentation/PUBLISHING.md`。

## 模型结果

| 模型 | 预测变量数 | 训练集 | 相同测试集 | 测试准确率 |
| --- | ---: | ---: | ---: | ---: |
| 紫色版 | 11 | 2466 | 617 | 76.5% |
| 天蓝色版 | 9 | 2466 | 617 | 65.6% |

编码：SEX 0=Male，1=Female；phenotyoe 1=α，2=β，3=γ，4=δ。
以上为内部留出测试结果，不代表已完成外部验证。

## 数据修正和重复训练

按病例 ID 对齐后，仅6条年龄变化，其他预测变量和分型标签不变。当前3,083例，年龄18–84岁，无缺失值。
两模型仍用固定参数和分层80/20划分（随机种子20260925），部署模型只拟合2,466例训练记录。
新Excel行顺序改变，因此本次617例测试集与旧版成员不同，准确率差异不能全部归因于年龄修正。

```sh
python scripts/train_models.py --data /path/to/corrected-study-data.xlsx --model both
```

程序读取第一张工作表并保留行顺序，也支持CSV和制表符文本。患者数据不上传至公共仓库。
