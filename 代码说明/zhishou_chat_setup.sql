-- 创建数据库
CREATE DATABASE IF NOT EXISTS `zhishou_chat_app` 
DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `zhishou_chat_app`;

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (--创建用户表，如果这个表不存在则创建
  `user_id` int unsigned NOT NULL AUTO_INCREMENT,--用户id，成整数自动增长
  `username` varchar(32) NOT NULL,--用户名，最多32个字段
  `password_hash` varchar(100) NOT NULL,--密码，最多100个字段，并且必须写
  `email` varchar(100) DEFAULT NULL,--邮箱，字段最多100字，可以不写
  `avatar` varchar(255) DEFAULT 'default.jpg',--头像图片的文件名，最多255个字段，若是不选头像，会有默认头像
  `status` enum('online','offline','busy','invisible') DEFAULT 'offline',--用户在线状态：在线、下线、忙碌、隐藏，默认在线状态
  `last_active` datetime DEFAULT NULL,--最后活跃时间
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,--用户当前时间并默认当前时间
  PRIMARY KEY (`user_id`),--把每个用户标识唯一
  UNIQUE KEY `username` (`username`),--UNIQUE KEY唯一约束，用户名不能重复
  UNIQUE KEY `email` (`email`)--也不能重复
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;--用InnoDB存储引擎（支持事务等功能）
--utf8mb4` = 默认字符集
--unicode_ci` = 排序规则

-- 好友关系表
CREATE TABLE IF NOT EXISTS `friends` (--创建好友关系表
  `relation_id` int unsigned NOT NULL AUTO_INCREMENT,--relation_id`= 关系ID（主键）和user_id一样是自增的整数
  `user1_id` int unsigned NOT NULL,
  `user2_id` int unsigned NOT NULL,--记录两个用户的ID，user1_id必须小于user2_id
  `relation_type` enum('friend','blocked') DEFAULT 'friend',--relation_type关系类型：（好友和拉黑）enum是选项表，里面有好友和拉黑选项 default是系统默认成好友的意思
  `status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',--status用来记录好友申请到哪了，pending等待对方通过好友申请，accepted同意好友，rejected拒绝好友；NOT NULL DEFAULT，必须填，不填默认pending；
  `action_user_id` int unsigned COMMENT '发起操作的用户ID',--action_user_id操作这段关系的人的id，int整数，unsigned非负数，comment小纸条
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,--created_at关系创建时间，默认自动设置为当前时间
  PRIMARY KEY (`relation_id`),--主键是relation_id
  UNIQUE KEY `unique_relationship` (`user1_id`,`user2_id`),--唯一约束，防止重复记录相同的用户组合
  KEY `user1_id` (`user1_id`),
  KEY `user2_id` (`user2_id`),--为这两个字段创建普通索引（加快查询速度）
  CONSTRAINT `chk_user_order` CHECK (`user1_id` < `user2_id`),--constraint约束条件，check检查1小于2
  CONSTRAINT `fk_friends_user1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,--foreign key外键约束，保证id存在于表中
  CONSTRAINT `fk_friends_user2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE--on delete cascade当用户被删时，自动删除好友关系
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;--和之前一样，指定存储引擎和字符集

-- 群组表
CREATE TABLE IF NOT EXISTS `groups` (
  `group_id` int unsigned NOT NULL AUTO_INCREMENT,--自增整数
  `group_name` varchar(64) NOT NULL,
  `creator_id` int unsigned NOT NULL,--创建者id，需是以存在用户
  `description` varchar(255) DEFAULT NULL,--description群组描写
  `announcement` text DEFAULT NULL,--announcement群公告，text长文本类型，default null可以不写
  `avatar` varchar(255) DEFAULT 'group_default.jpg',--avatar群组头像，varchar可变长字符串
  `max_members` int unsigned DEFAULT 500,--群成员上限，默认500人
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,--创建时间
  PRIMARY KEY (`group_id`),
  KEY `creator_id` (`creator_id`),--为id创建索引
  CONSTRAINT `fk_groups_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;--当创建者被删除时，群组自动解散删除

-- 群组成员表
CREATE TABLE IF NOT EXISTS `group_members` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `group_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `role` enum('owner','admin','member') DEFAULT 'member',--role成员角色，群主，管理员，普通成员，默认普通成员
  `is_muted` tinyint(1) NOT NULL DEFAULT 0,--是否被禁言
  `joined_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,--默认当前时间为加入时间
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_membership` (`group_id`,`user_id`),--确保同一个用户在用一个群组只有一条记录
  KEY `group_id` (`group_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_group_members_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`group_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_group_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;--确保群组成员表里的数据不乱，

-- 消息表
CREATE TABLE IF NOT EXISTS `messages` (
  `msg_id` bigint unsigned NOT NULL AUTO_INCREMENT,--bigint大整数类型（为消息量过大准备）
  `sender_id` int unsigned NOT NULL,
  `receiver_type` enum('private','group') NOT NULL,--receiver_type接受这类型，private私聊，group群聊
  `receiver_id` int unsigned NOT NULL,--私聊为用户id，群聊为群组id
  `content` text NOT NULL,--消息不能为空
  `content_type` enum('text','image','file','video') DEFAULT 'text',--内容类型可以是文本，图片文件视频，默认文本
  `file_url` varchar(512) DEFAULT NULL,--文件等消息的粗存，最长为512字符
  `is_read` tinyint(1) DEFAULT 0,--是否已读，默认未读
  `status` enum('sent','delivered','deleted') NOT NULL DEFAULT 'sent',
  `recalled_at` datetime DEFAULT NULL,--发送状态，已发送，已送达，已删除，，默认已发送
  `recalled_by` int unsigned DEFAULT NULL,--撤回时间，若为null表示未撤回
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),--创建时间，datetime（3）精确到毫秒，默认当前时间
  PRIMARY KEY (`msg_id`),--设为主键
  KEY `sender_id` (`sender_id`),
  KEY `receiver_composite` (`receiver_type`,`receiver_id`),--创建索引
  KEY `created_at` (`created_at`),
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;--设置外键约束，确保id是有效的用户id；on delete cascade用户被删，消息也被删

-- 消息已读表（这个也不用写）
CREATE TABLE IF NOT EXISTS `message_reads` (--建表，记录用户已读信息
  `read_id` int unsigned NOT NULL AUTO_INCREMENT,--主键id，自增整数
  `msg_id` bigint unsigned NOT NULL,--消息id，必须存在
  `user_id` int unsigned NOT NULL,--用户id，必须存在
  `read_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,--阅读时间，默认当前时间
  PRIMARY KEY (`read_id`),--设置read_id为主键
  UNIQUE KEY `unique_read` (`msg_id`,`user_id`),--保证用户对同一条消息只记录一次已读
  KEY `msg_id` (`msg_id`),--创建索引
  KEY `user_id` (`user_id`),--创建索引
  CONSTRAINT `fk_message_reads_msg` FOREIGN KEY (`msg_id`) REFERENCES `messages` (`msg_id`) ON DELETE CASCADE,--设置外键约束，确保msg和user_id都有效
  CONSTRAINT `fk_message_reads_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE--当消息或用户被删，自动删除已读记录
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 登录尝试记录表
CREATE TABLE IF NOT EXISTS `login_attempts` (--创建表，用于安全目的
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(32) NOT NULL,--用户名长度
  `attempt_count` int unsigned NOT NULL DEFAULT 0,--尝试登录次数，默认0
  `last_attempt` int NOT NULL COMMENT 'Unix时间戳',--最后尝试时间，
  PRIMARY KEY (`id`),--设为主键
  UNIQUE KEY `username` (`username`)--每个用户只有一条记录
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE if NOT EXISTS `ip_id`(--创建IP和用户id的关联表
  `ip` varchar(45) NOT NULL,--IP字段
  `user_id` int UNSIGNED NOT NULL,--关联的用户id
  PRIMARY KEY (`ip`),--主键
  CONSTRAINT `fk_ip_id_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- 创建数据库用户并授权（这个王雨田说了，不用学）
CREATE USER IF NOT EXISTS 'chat_app'@'localhost' IDENTIFIED BY 'zhishou_chat';
GRANT ALL PRIVILEGES ON zhishou_chat_app.* TO 'chat_app'@'localhost';
FLUSH PRIVILEGES;