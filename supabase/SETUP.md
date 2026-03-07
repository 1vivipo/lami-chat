# 数据库初始化指南

## 步骤 1：创建数据库表

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard/project/uxpzbwjqfnwvxjllcadj)
2. 点击左侧菜单的 **SQL Editor**
3. 点击 **New query**
4. 复制 `supabase/schema.sql` 文件的全部内容
5. 粘贴到编辑器中
6. 点击 **Run** 执行

## 步骤 2：验证表创建

执行以下 SQL 验证表是否创建成功：

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

应该看到以下表：
- users
- user_settings
- friend_requests
- friendships
- conversations
- conversation_participants
- messages
- groups
- group_members

## 步骤 3：创建测试账号用户资料

由于认证用户已创建，需要为它们创建 users 表记录：

```sql
-- 为测试用户创建资料
INSERT INTO users (id, email, account, nickname, signature) VALUES
('02c1355e-0c9c-4068-9e49-cf08f8235e51', 'test1@lamichat.com', 'TEST01', '测试用户1', '我是测试用户1，欢迎使用Lami Chat！'),
('fb8699e0-b61e-48f1-84d9-c0f0b9de31cf', 'test2@lamichat.com', 'TEST02', '测试用户2', '我是测试用户2，欢迎使用Lami Chat！'),
('dfb4f55e-bea9-4754-9210-00ede1851719', 'test3@lamichat.com', 'TEST03', '测试用户3', '我是测试用户3，欢迎使用Lami Chat！');
```

## 步骤 4：验证存储桶

1. 点击左侧菜单的 **Storage**
2. 确认以下存储桶已创建：
   - avatars
   - chat-images
   - chat-voices

如果没有，手动创建它们并设置为 Public。

## 测试账号信息

| 账号 | 密码 | 邮箱 |
|------|------|------|
| TEST01 | Test123456 | test1@lamichat.com |
| TEST02 | Test123456 | test2@lamichat.com |
| TEST03 | Test123456 | test3@lamichat.com |

## 完成后

数据库初始化完成后，应用即可正常使用！
