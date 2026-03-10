#!/bin/bash
# GitHub Actions 构建日志读取脚本
# 用法: ./get-build-log.sh <run_id> [step_name]

REPO="1vivipo/lami-chat"
TOKEN="7rlnN8DnBXZ57TftXkOibKDy8mQRZLvrmW13-8BF"

if [ -z "$1" ]; then
    echo "获取最新的构建..."
    RUN_ID=$(curl -s -H "Authorization: token $TOKEN" \
        "https://api.github.com/repos/$REPO/actions/runs?per_page=1" | \
        jq -r '.workflow_runs[0].id')
else
    RUN_ID=$1
fi

echo "Run ID: $RUN_ID"

# 获取 job 信息
JOB_URL="https://api.github.com/repos/$REPO/actions/runs/$RUN_ID/jobs"
echo "获取 job 信息: $JOB_URL"

JOBS=$(curl -s -H "Authorization: token $TOKEN" "$JOB_URL")

# 找到失败的步骤
echo ""
echo "=== 步骤状态 ==="
echo "$JOBS" | jq -r '.jobs[0].steps[] | "\(.name): \(.conclusion)"'

# 获取失败步骤的名称
FAILED_STEP=$(echo "$JOBS" | jq -r '.jobs[0].steps[] | select(.conclusion == "failure") | .name' | head -1)

if [ -z "$FAILED_STEP" ]; then
    echo ""
    echo "没有找到失败的步骤"
    exit 0
fi

echo ""
echo "=== 失败的步骤: $FAILED_STEP ==="

# 获取日志下载 URL
LOG_URL=$(echo "$JOBS" | jq -r '.jobs[0].steps[] | select(.name == "'"$FAILED_STEP"'") | .log_url // empty')

if [ -z "$LOG_URL" ]; then
    # 尝试获取整个 job 的日志
    JOB_ID=$(echo "$JOBS" | jq -r '.jobs[0].id')
    LOG_URL="https://api.github.com/repos/$REPO/actions/jobs/$JOB_ID/logs"
fi

echo "日志 URL: $LOG_URL"

# 下载日志
echo ""
echo "=== 下载日志 ==="
curl -s -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github.v3+json" \
    "$LOG_URL" -o /tmp/build_log.txt

# 显示日志中的错误
echo ""
echo "=== 错误信息 ==="
grep -i -A 5 "FAILURE\|error\|failed\|exception" /tmp/build_log.txt | head -100

echo ""
echo "完整日志已保存到: /tmp/build_log.txt"
