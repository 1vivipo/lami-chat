#!/usr/bin/env python3
"""
GitHub Actions 构建日志分析工具
自动获取构建状态和错误信息
"""

import json
import sys
import urllib.request
import urllib.error
from datetime import datetime

REPO_OWNER = "1vivipo"
REPO_NAME = "lami-chat"

def github_api(endpoint: str) -> dict:
    """调用 GitHub API"""
    url = f"https://api.github.com{endpoint}"
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        return {"error": str(e)}

def get_latest_run() -> dict:
    """获取最新的构建运行"""
    data = github_api(f"/repos/{REPO_OWNER}/{REPO_NAME}/actions/runs?per_page=1")
    if "workflow_runs" in data and data["workflow_runs"]:
        return data["workflow_runs"][0]
    return {}

def get_job_info(run_id: str) -> dict:
    """获取 Job 信息"""
    data = github_api(f"/repos/{REPO_OWNER}/{REPO_NAME}/actions/runs/{run_id}/jobs")
    if "jobs" in data and data["jobs"]:
        return data["jobs"][0]
    return {}

def get_artifacts(run_id: str) -> list:
    """获取 Artifacts"""
    data = github_api(f"/repos/{REPO_OWNER}/{REPO_NAME}/actions/runs/{run_id}/artifacts")
    return data.get("artifacts", [])

def get_error_issue() -> dict:
    """获取错误 Issue"""
    data = github_api(f"/repos/{REPO_OWNER}/{REPO_NAME}/issues?labels=build-error&state=open&per_page=1")
    if data and not isinstance(data, dict):
        return data[0]
    return {}

def analyze_build():
    """分析构建状态"""
    print("=" * 50)
    print("GitHub Actions 构建分析")
    print("=" * 50)
    
    # 获取最新运行
    run = get_latest_run()
    if not run:
        print("❌ 无法获取构建信息")
        return
    
    run_id = run.get("id")
    status = run.get("status", "unknown")
    conclusion = run.get("conclusion", "running")
    html_url = run.get("html_url", "")
    created_at = run.get("created_at", "")
    
    print(f"\n📊 构建状态:")
    print(f"  运行 ID: {run_id}")
    print(f"  状态: {status}")
    print(f"  结果: {conclusion}")
    print(f"  时间: {created_at}")
    print(f"  链接: {html_url}")
    
    # 获取步骤信息
    job = get_job_info(str(run_id))
    if job:
        print(f"\n📋 构建步骤:")
        for step in job.get("steps", []):
            step_name = step.get("name", "")
            step_conclusion = step.get("conclusion", "running")
            
            if step_conclusion == "success":
                icon = "✅"
            elif step_conclusion == "failure":
                icon = "❌"
            elif step_conclusion == "skipped":
                icon = "⏭️"
            else:
                icon = "⏳"
            
            print(f"  {icon} {step_name}: {step_conclusion}")
    
    # 如果失败，获取错误信息
    if conclusion == "failure":
        print(f"\n❌ 构建失败！正在获取错误信息...")
        
        # 检查 Issue
        issue = get_error_issue()
        if issue:
            print(f"\n📝 错误 Issue:")
            print(f"  标题: {issue.get('title', '')}")
            print(f"  链接: {issue.get('html_url', '')}")
            
            body = issue.get("body", "")
            if "错误摘要" in body:
                # 提取错误摘要部分
                start = body.find("```")
                if start != -1:
                    end = body.find("```", start + 3)
                    if end != -1:
                        error_text = body[start+3:end].strip()
                        print(f"\n🔍 错误摘要:")
                        print(error_text[:2000])
        
        # 检查 Artifacts
        artifacts = get_artifacts(str(run_id))
        error_artifact = next((a for a in artifacts if a["name"] == "error-log"), None)
        if error_artifact:
            print(f"\n📦 错误日志 Artifact:")
            print(f"  名称: {error_artifact.get('name', '')}")
            print(f"  下载: https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/actions/artifacts/{error_artifact.get('id')}/zip")
    
    elif conclusion == "success":
        print(f"\n✅ 构建成功！")
        
        # 检查 APK Artifact
        artifacts = get_artifacts(str(run_id))
        apk_artifact = next((a for a in artifacts if a["name"] == "lami-chat-apk"), None)
        if apk_artifact:
            print(f"\n📦 APK 已生成:")
            print(f"  名称: {apk_artifact.get('name', '')}")
            print(f"  大小: {apk_artifact.get('size_in_bytes', 0) / 1024 / 1024:.2f} MB")
    
    else:
        print(f"\n⏳ 构建进行中...")
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    analyze_build()
