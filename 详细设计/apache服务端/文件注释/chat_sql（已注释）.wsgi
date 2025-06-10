        # 调用方法获取所有用户数据
        users = db.get_all_users()
        
        # 将用户数据转换为JSON格式，并编码为UTF-8字节串
        response_body = json.dumps(users).encode('utf-8')
        
        # 设置HTTP响应状态码和响应头
        # 200 OK - 请求成功
        # Content-Type: application/json - 返回的是JSON数据
        # Access-Control-Allow-Origin: * - 允许所有网站跨域访问这个接口
        start_response('200 OK', [
            ('Content-Type', 'application/json'),
            ('Access-Control-Allow-Origin', '*')
        ])
        
        # 返回响应内容，WSGI要求返回一个可迭代对象，所以放在列表中
        return [response_body]

    # ===================== 2. 群组列表接口 =====================
    # 处理路径为'/groups'的GET请求 (获取用户所属群组)
    elif environ['REQUEST_METHOD'] == 'GET' and environ['PATH_INFO'] == '/groups':
        # 从URL查询字符串中获取参数，例如: /groups?user_id=123
        query = environ.get('QUERY_STRING', '')
        
        # 初始化user_id变量
        user_id = None
        
        # 解析查询字符串，查找user_id参数
        # 查询字符串格式如: "user_id=123&name=test"，用&分割
        for part in query.split('&'):
            # 找到以user_id=开头的部分
            if part.startswith('user_id='):
                # 提取user_id的值
                user_id = part.split('=')[1]
                break
        
        # 检查user_id是否存在且有效
        if not user_id or user_id == 'None':
            # 如果无效，返回400错误 (客户端请求错误)
            start_response('400 Bad Request', [('Content-Type', 'application/json')])
            # 返回错误信息
            return [json.dumps({"error": "user_id is required"}).encode('utf-8')]
        
        # 将user_id转换为整数类型
        user_id = int(user_id)
        
        # 创建数据库管理器实例
        db = DatabaseManager()
        
        # 调用方法获取用户所属群组
        groups = db.get_user_groups(user_id)
        
        # 将群组数据转换为JSON格式
        response_body = json.dumps(groups).encode('utf-8')
        
        # 设置成功响应
        start_response('200 OK', [
            ('Content-Type', 'application/json'),
            ('Access-Control-Allow-Origin', '*')
        ])
        
        # 返回群组数据
        return [response_body]

    # ===================== 3. 消息历史接口 =====================
    # 处理路径为'/messages'的POST请求 (获取聊天消息记录)
    elif environ['REQUEST_METHOD'] == 'POST' and environ['PATH_INFO'] == '/messages':
        # 获取POST请求的内容长度
        request_length = int(environ.get('CONTENT_LENGTH', 0))
        
        # 读取POST请求的请求体数据
        request_body = environ['wsgi.input'].read(request_length)
        
        # 将JSON格式的请求体解析为Python字典
        data = json.loads(request_body.decode('utf-8'))
        
        # 从请求数据中获取各个参数
        user_id_raw = data.get('userId')  # 用户ID
        chat_id_raw = data.get('chatId')  # 聊天ID
        chat_type = data.get('type')     # 聊天类型(私聊/群聊)
        page = int(data.get('page', 1))  # 页码，默认为1
        page_size = int(data.get('pageSize', 20))  # 每页条数，默认为20
        
        # 检查必需参数是否存在
        if user_id_raw is None or chat_id_raw is None or chat_type is None:
            # 如果有参数缺失，返回400错误
            start_response('400 Bad Request', [('Content-Type', 'application/json')])
            return [json.dumps({"error": "userId, chatId, and type are required"}).encode('utf-8')]
        
        try:
            # 将用户ID和聊天ID转换为整数
            user_id = int(user_id_raw)
            chat_id = int(chat_id_raw)
        except Exception:
            # 如果转换失败，返回400错误
            start_response('400 Bad Request', [('Content-Type', 'application/json')])
            return [json.dumps({"error": "userId and chatId must be integers"}).encode('utf-8')]
        
        # 创建消息服务实例
        ms = MessageService()
        
        # 调用方法获取消息记录
        result = ms.get_messages(user_id, chat_type, chat_id, page, page_size)
        
        # 准备返回的消息列表
        messages = []
        
        # 如果获取消息成功
        if result["success"]:
            # 遍历每条消息
            for msg in result["messages"]:
                # 判断消息是当前用户发送的还是接收的
                msg_type = "sent" if msg["sender_id"] == user_id else "received"
                
                # 将消息格式化为前端需要的结构
                messages.append({
                    "type": msg_type,  # 消息类型(sent/received)
                    "content": msg["content"],  # 消息内容
                    "sender_id": str(msg["sender_id"]),  # 发送者ID
                    "senderAvatar": str(msg["sender_id"]),  # 发送者头像(这里简化处理)
                    "msg_id": msg["msg_id"]  # 消息ID
                })
            
            # 将消息列表转换为JSON格式
            response_body = json.dumps(messages).encode('utf-8')
            
            # 设置成功响应
            start_response('200 OK', [
                ('Content-Type', 'application/json'),
                ('Access-Control-Allow-Origin', '*')
            ])
            
            # 返回消息数据
            return [response_body]
        else:
            # 如果获取消息失败，返回500服务器错误
            start_response('500 Internal Server Error', [('Content-Type', 'application/json')])
            return [json.dumps({"error": result["error"]}).encode('utf-8')]

    # ===================== 4. 用户信息接口 =====================
    # 处理路径为'/user_info'的GET请求 (获取单个用户信息)
    elif environ['REQUEST_METHOD'] == 'GET' and environ['PATH_INFO'] == '/user_info':
        # 从URL查询字符串中获取参数，例如: /user_info?id=123
        query = environ.get('QUERY_STRING', '')
        
        # 初始化user_id变量
        user_id = None
        
        # 解析查询字符串，查找id参数
        for part in query.split('&'):
            if part.startswith('id='):
                # 提取id的值
                user_id = part.split('=')[1]
                break
        
        # 检查id是否存在且有效
        if not user_id or user_id == 'None':
            # 如果无效，返回400错误
            start_response('400 Bad Request', [('Content-Type', 'application/json')])
            return [json.dumps({"error": "id is required"}).encode('utf-8')]
        
        try:
            # 将id转换为整数
            user_id = int(user_id)
        except Exception:
            # 如果转换失败，返回400错误
            start_response('400 Bad Request', [('Content-Type', 'application/json')])
            return [json.dumps({"error": "id must be integer"}).encode('utf-8')]
        
        # 创建数据库管理器实例
        db = DatabaseManager()
        
        # 执行SQL查询，获取用户信息
        user = db.execute_query(
            "SELECT user_id, username, avatar FROM users WHERE user_id = %s",
            (user_id,)  # 参数化查询，防止SQL注入
        )
        
        # 如果查询到用户数据
        if user:
            # 将用户数据转换为JSON格式
            response_body = json.dumps(user[0]).encode('utf-8')
            
            # 设置成功响应
            start_response('200 OK', [
                ('Content-Type', 'application/json'),
                ('Access-Control-Allow-Origin', '*')
            ])
            
            # 返回用户数据
            return [response_body]
        else:
            # 如果用户不存在，返回404错误
            start_response('404 Not Found', [('Content-Type', 'application/json')])
            return [json.dumps({"error": "User not found"}).encode('utf-8')]

# ===================== 全局异常处理 =====================
except Exception as e:
    # 将错误信息写入标准错误输出(通常会记录到日志文件)
    sys.stderr.write(f"错误详情: {str(e)}\n")
    
    # 设置500服务器错误响应
    start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
    
    # 返回简单的错误信息
    return [b'Internal Server Error']