# -*- coding: utf-8 -*-  # 声明文件使用UTF-8编码（支持中文）

# 导入系统工具包（用来输出错误日志等）
import sys
# 导入JSON工具包（用来解析和生成JSON数据）
import json

# 把自定义模块所在的路径添加到Python的搜索路径中
# 相当于告诉Python："去D盘的web_project/4文件夹里找我要用的工具"
sys.path.insert(0, 'D:/web_project/4/')

# 从sql_program模块中导入两个类：
# DatabaseManager - 管理数据库连接的工具
# GroupService - 处理群组相关操作的工具
from sql_program import DatabaseManager, GroupService

# 定义WSGI应用程序入口函数（所有请求都会先到这里）
# environ - 包含所有请求信息的字典（比如请求方法、路径、请求体等）
# start_response - 用于设置返回的HTTP状态码和响应头的函数
def application(environ, start_response):
    try:
        # 检查请求方法是否是POST（只处理POST请求）
        if environ['REQUEST_METHOD'] == 'POST':
            # 读取请求体数据（就是前端发送过来的JSON字符串）
            # CONTENT_LENGTH是请求体的长度（单位是字节）
            request_body = environ['wsgi.input'].read(
                int(environ.get('CONTENT_LENGTH', 0))
            )
            
            # 把读取到的二进制数据解码成UTF-8字符串，再转换成Python字典
            # 例如：把'{"creator_id":1,"group_name":"测试群"}'变成字典
            data = json.loads(request_body.decode('utf-8'))
            
            # 定义必填字段：创建人ID和群名称
            required_fields = ['creator_id', 'group_name']
            
            # 检查请求数据是否包含所有必填字段
            # 如果有缺失就抛出KeyError异常
            if not all(field in data for field in required_fields):
                raise KeyError("缺少必要参数")
                
            # 创建GroupService实例（传入数据库管理工具）
            gs = GroupService(DatabaseManager())
            
            # 调用创建群组方法：
            # creator_id - 转为整数
            # group_name - 去掉首尾空格
            # members - 如果没有传就默认空列表，有的话把每个成员ID转成整数
            result = gs.create_group(
                int(data['creator_id']),
                data['group_name'].strip(),
                [int(m) for m in data.get('members', [])]
            )

            # 根据操作结果设置HTTP状态码：
            # 成功返回200，失败返回400
            status = '200 OK' if result['success'] else '400 Bad Request'
            
            # 把结果字典转换成JSON字符串，再编码成二进制数据
            response_body = json.dumps(result).encode('utf-8')
            
            # 设置响应头（告诉浏览器返回的是JSON数据）
            start_response(status, [('Content-Type', 'application/json')])
            
            # 返回响应体（必须是二进制格式的列表）
            return [response_body]

    # 如果执行过程中发生任何异常：
    except Exception as e:
        # 在错误日志中记录异常信息（方便开发者排查问题）
        sys.stderr.write(f"错误详情: {str(e)}\n")
        
        # 返回500错误（服务器内部错误）
        start_response('500 Internal Server Error', 
                      [('Content-Type', 'text/plain')])
        
        # 返回简单的错误提示（注意要用二进制格式）
        return [b'Internal Server big problem Error']
    # 如果不是POST请求（比如GET、PUT等），执行到这里：
    # 返回标准的404错误响应
    start_response('404 Not Found', [
        ('Content-Type', 'text/plain'),  # 纯文本类型
        ('Content-Length', '9')           # 内容长度（"Not Found"是9个字节）
    ])
    # 返回二进制格式的错误提示
    return [b'Not Found']  # 注意：必须是二进制（bytes）格式