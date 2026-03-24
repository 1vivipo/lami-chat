#!/bin/bash

# 自动获取 GitHub Actions 构建日志的脚本
# 用法: ./scripts/get-build-log.sh [run_id]

REPO_OWNER="1vivipo"
REPO_NAME="lami-chat"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

# 如果没有提供 run_id，获取最新的运行
if [ -z "$1" ]; then
  echo "获取最新的构建运行..."
  RUN_ID=$(curl -s "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=1" | \
    python3 -c "import sys,json; d=json.load(sys.stdin); print(d['workflow_runs'][0]['id'] if d['workflow_runs'] else '')")
else
  RUN_ID=$1
fi

if [ -z "$RUN_ID" ]; then
  echo "未找到构建运行"
  exit 1
fi

echo "构建运行 ID: $RUN_ID"

# 获取运行状态
echo ""
echo "=== 构建状态 ==="
curl -s "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${RUN_ID}" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"状态: {d['status']}\"); print(f\"结果: {d.get('conclusion', 'running')}\"); print(f\"链接: {d['html_url']}\")"

# 获取 Job ID
JOB_ID=$(curl -s "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${RUN_ID}/jobs" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d['jobs'][0]['id'] if d['jobs'] else '')")

if [ -z "$JOB_ID" ]; then
  echo "未找到 Job"
  exit 1
fi

echo ""
echo "Job ID: $JOB_ID"

# 获取步骤信息
echo ""
echo "=== 构建步骤 ==="
curl -s "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/jobs/${JOB_ID}" | \
  python3 -c "
import sys,json
d = json.load(sys.stdin)
for step in d.get('steps', []):
    status = step.get('conclusion', 'running')
    icon = '✅' if status == 'success' else '❌' if status == 'failure' else '⏳'
    print(f\"{icon} {step['name']}: {status}\")
"

# 检查是否有错误 artifact
echo ""
echo "=== 检查错误日志 ==="
ARTIFACTS=$(curl -s "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${RUN_ID}/artifacts")

ERROR_ARTIFACT_ID=$(echo "$ARTIFACTS" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(next((a['id'] for a in d.get('artifacts', []) if a['name'] == 'error-log'), ''))")

if [ -n "$ERROR_ARTIFACT_ID" ]; then
  echo "找到错误日志 artifact: $ERROR_ARTIFACT_ID"
  echo ""
  echo "下载链接:"
  echo "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/artifacts/${ERROR_ARTIFACT_ID}/zip"
else
  echo "未找到错误日志 artifact"
fi

# 检查是否有 Issue
echo ""
echo "=== 检查错误 Issue ==="
curl -s "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues?labels=build-error&state=open&per_page=1" | \
  python3 -c "
import sys,json
d = json.load(sys.stdin)
if d:
    issue = d[0]
    print(f\"Issue #{issue['number']}: {issue['title']}\")
    print(f\"链接: {issue['html_url']}\")
    print()
    print('错误内容:')
    print(issue['body'][:2000] if len(issue['body']) > 2000 else issue['body'])
else:
    print('未找到错误 Issue')
"

echo ""
echo "=== 完成 ==="
