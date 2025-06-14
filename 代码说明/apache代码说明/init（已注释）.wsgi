# -*- coding: utf-8 -*-  # 设置文件编码为UTF-8，支持中文

# 导入系统模块
import sys
# 将自定义模块路径添加到系统路径中
sys.path.insert(0, 'D:/web_project/4/')
# 从sql_program模块导入数据库管理和认证服务类
from sql_program import DatabaseManager, AuthService   

# WSGI应用入口函数
def application(environ, start_response):
    """
    处理所有HTTP请求的主函数
    environ: 包含请求信息的字典
    start_response: 用于设置响应状态的函数
    """
    # 获取请求方法(GET/POST等)
    request_method = environ.get('REQUEST_METHOD', '')
    
    # ==================== 处理登录请求 ====================
    if request_method == 'POST' and environ['PATH_INFO'] == '/sign_in':
        # 读取POST请求体数据并解码为UTF-8字符串
        post_data = environ['wsgi.input'].read().decode('utf-8')
        
        # 解析表单数据(格式为key1=value1&key2=value2)
        fields = {}
        for field in post_data.split('&'):  # 按&分割各个字段
            key, value = field.split('=')   # 每个字段按=分割键值
            fields[key] = value             # 存入字典
        
        # 获取用户名和密码
        username = fields.get('username', '')
        password = fields.get('password', '')

        # 初始化数据库和认证服务
        Db = DatabaseManager()
        auth = AuthService(Db)
        # 尝试登录验证
        result = auth.login_user(username, password)

        # 登录成功处理
        if result['success'] == True:
            try:
                # 读取主页HTML文件
                with open('D:/web_project/4/html/main_web.html', 'r', encoding='utf-8') as f:
                    response_body = f.read()
                
                # 在页面插入JavaScript代码，将用户ID保存到本地存储
                insert_js = f"""
<script>
    localStorage.setItem('currentUserId', '{result["user_id"]}');
</script>
"""
                # 将JS代码插入到</body>标签前
                if '</body>' in response_body:
                    response_body = response_body.replace('</body>', insert_js + '</body>')
                else:
                    response_body += insert_js

                # 设置成功响应头
                status = '200 OK'
                response_headers = [
                    ('Content-Type', 'text/html; charset=utf-8'),
                    ('Content-Length', str(len(response_body.encode('utf-8'))))
                ]

            except FileNotFoundError:
                # 如果主页文件不存在，返回404错误
                response_body = "404 Not Found"
                status = '404 Not Found'
                response_headers = [
                    ('Content-Type', 'text/plain'),
                    ('Content-Length', str(len(response_body)))
                ]
                
        else:
            # 登录失败，返回登录失败页面
            with open('D:/web_project/4/html/sign_in_failed_web.html', 'r', encoding='utf-8') as f:
                response_body = f.read()
            status = '200 OK'  
            response_headers = [
                ('Content-Type', 'text/html; charset=utf-8'),
                ('Content-Length', str(len(response_body.encode('utf-8'))))
            ]

    # ==================== 处理注册请求 ====================
    elif request_method == 'POST' and environ['PATH_INFO'] == '/sign_up':
        # 读取POST请求体数据
        post_data = environ['wsgi.input'].read().decode('utf-8')
        
        # 解析表单数据
        fields = {}
        for field in post_data.split('&'):
            key, value = field.split('=')
            fields[key] = value
        
        # 获取用户名和密码
        username = fields.get('username', '')
        password = fields.get('password', '')

        # 初始化数据库和认证服务
        Db = DatabaseManager()
        auth = AuthService(Db)
        # 尝试注册新用户
        result = auth.register_user(username, password)

        # 注册成功处理
        if result['success'] == True:
            response_body = "成功注册！"
            status = '200 OK'
            response_headers = [
                ('Content-Type', 'text/plain; charset=utf-8'),
                ('Content-Length', str(len(response_body.encode('utf-8'))))
            ]
        else:
            # 注册失败，返回错误信息
            response_body = result['error']
            status = '200 OK'  
            response_headers = [
                ('Content-Type', 'text/plain; charset=utf-8'),
                ('Content-Length', str(len(response_body.encode('utf-8'))))
            ]
    
    # ==================== 处理其他请求 ====================
    else:
        # 返回408请求超时错误
        response_body = "408 Request Time-out"
        status = '408 Request Time-out'
        response_headers = [
            ('Content-Type', 'text/plain; charset=utf-8'),
            ('Content-Length', str(len(response_body.encode('utf-8'))))
        ]

    # 设置响应状态和头部信息
    start_response(status, response_headers)
    
    # 返回响应内容(必须为bytes类型)
    return [response_body.encode('utf-8')]
