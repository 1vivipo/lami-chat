# Lami Chat

简洁、纯粹的聊天应用

## 功能特性

- 📱 简洁的聊天界面
- 👤 个人资料管理（头像、昵称、签名、账号）
- 👥 好友系统（添加、接受、拒绝）
- 💬 1v1聊天（文字消息）
- 🎨 主题切换（浅色/深色/跟随系统）
- 🔔 消息通知
- 🔒 安全认证（邮箱+密码注册登录）
- 📝 账号修改（每月一次，带冷却期）

## 技术栈

- **前端**: React Native + Expo
- **后端**: Supabase (Auth, Database, Storage, Realtime)
- **状态管理**: Zustand
- **导航**: Expo Router

## 数据库设置

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目 `pretty thing`
3. 进入 SQL Editor
4. 复制 `supabase/schema.sql` 的内容并执行

## 测试账号

| 账号 | 密码 | 邮箱 |
|------|------|------|
| TEST01 | Test123456 | test1@lamichat.com |
| TEST02 | Test123456 | test2@lamichat.com |
| TEST03 | Test123456 | test3@lamichat.com |

> 注意：测试账号需要在数据库表创建后才能正常使用

## 开发

```bash
# 安装依赖
bun install

# 启动开发服务器
bun start

# Android
bun run android

# iOS
bun run ios
```

## 构建 APK

### 方法一：GitHub Actions（推荐）

1. Fork 本仓库
2. 在仓库设置中添加 Secret：`EXPO_TOKEN`（从 [Expo](https://expo.dev) 获取）
3. 推送代码到 main 分支
4. 等待 GitHub Actions 构建完成
5. 在 Releases 页面下载 APK

### 方法二：本地构建

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo
eas login

# 构建 APK
eas build --platform android --profile preview
```

## 下载

从 [Releases](https://github.com/1vivipo/lami-chat/releases) 页面下载最新版本的 APK。

## 安装说明

1. 下载 APK 文件
2. 在手机上打开并允许安装未知来源应用
3. 按照提示完成安装
4. 使用测试账号或注册新账号登录

## 项目结构

```
lami-chat/
├── app/                    # 页面组件
│   ├── (auth)/            # 认证相关页面
│   ├── (tabs)/            # 底部导航页面
│   └── chat/              # 聊天页面
├── components/            # 公共组件
├── constants/             # 常量配置
├── hooks/                 # 自定义 Hooks
├── lib/                   # 工具库
│   ├── api.ts            # API 接口
│   └── supabase.ts       # Supabase 客户端
├── store/                 # 状态管理
├── supabase/              # 数据库脚本
└── types/                 # TypeScript 类型
```

## 许可证

MIT
