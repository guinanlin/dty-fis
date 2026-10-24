# 长期开发规则 (Long-term Development Rules)

- 所有开发改动直接提交到主分支 `dty`，并推送至 `origin/dty`。
- 禁止创建新分支，禁止开 PR（不创建 feature branch，不做 merge request）。
- 此规则自当前合并任务完成即生效：`feat/finance-port` 已合并进 `dty`（commit `9b204d8`），本地分支已清理至仅剩 `dty`。
- 若存在其他已有的开发约定文档，须保留并遵循；相关文档包括：[CONTRIBUTING.md](CONTRIBUTING.md)、[开发指南](docs/dev/development-guide.md)、[前端运行模式](docs/dev/frontend-run-mode.md) 以及 [`.cursor/rules/`](.cursor/rules/)。

