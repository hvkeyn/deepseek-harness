---
description: "Web 插件设置中的技能管理标签页：列出本地技能、在不删除文件的前提下启用或停用、添加新技能、删除用户技能。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-settings-skills

[English](README.md) | 中文

## 概述

本包在「设置 → 插件」中贡献一个标签页。它读取 `skills` Remote 的管理目录（包含对模型隐藏的技能），通过 `skills/setEnabled` 切换技能，通过 `skills/create` 把新技能写入 `<dshHome>/skills`，并仅通过 `skills/remove` 删除该目录下的文件。项目技能在此只读，因为它们的文件属于代码仓库。

## 标签页内容

- 每个技能的名称、描述和说明文件路径；
- 每个技能一个开关：关闭后该技能从模型的 `skill` 工具和 `/` 建议中消失，文件保持不变；
- 添加表单会校验本地契约的名称规则（`a-z`、`0-9`、连字符，以字母开头）和 12 000 字节上限。

## 说明

Host 服务是 `@deepseek-ai/dsh-api-session-controller` 中的 `SessionSkillCatalog`，以 `skills` Remote 命名空间暴露。启用状态保存在 `<dshHome>/skills.json`，并在每次读取目录时应用到技能注册表，因此模型和输入框始终一致。
