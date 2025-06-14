const WebSocketManager = {
    ws: null,          // WebSocket 连接对象
    reconnectAttempts: 0, // 重连尝试次数

    // 初始化 WebSocket 连接
    init: function() {
        const userId = localStorage.getItem('currentUserId');
        if (!userId) return;  // 如果没有用户ID则不初始化

        /*localStorage：浏览器的“小仓库”，可以存一些数据（比如用户名、设置）。
         getItem('currentUserId')：从“小仓库”里取出名叫 currentUserId 的数据（当前用户的ID）。
         const（声明） userId：把取到的用户ID存到变量 userId 里。
         !userId：如果 userId 是空的（! 表示“不是”）
         ​作用​：检查用户是否登录（没登录就不继续了）。*/ 



        // 根据当前协议选择ws或wss
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        /*window.location.protocol：检查当前网页是 http: 还是 https:（安全协议）。
         ? 'wss:' : 'ws:'：
           如果是 https:，用 wss:（加密的WebSocket）。
           否则用 ws:（普通的WebSocket）。
        const wsProtocol：把结果存到 wsProtocol 变量里。
        ​作用​：选择正确的聊天协议（就像选“普通电话”还是“加密电话”）*/ 
    
        this.ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);
        /*new WebSocket()：创建一个新的WebSocket连接。
        `${wsProtocol}//${window.location.host}/ws`：
            wsProtocol：前面选的协议（ws: 或 wss:）。
            window.location.host：当前网站的地址（比如 example.com）。
            /ws：连接的路径（服务器用来识别这是聊天连接）。
            this.ws：把连接对象存到 ws 属性里（方便其他地方用）。
            ​作用​：正式建立聊天连接！
        */


        // WebSocket 打开时的回调
        this.ws.onopen = () => {
            this.send({ action: 'login', user_id: parseInt(userId) }); // 登录
            this.reconnectAttempts = 0; // 重置重连计数器
        };
        /*this.ws.onopen = () => {意思是聊天议案链接成功建立时执行括号里代码

         this.send()：调用另一个方法（send）来发消息。
                { action: 'login', user_id: parseInt(userId) }：
                    action: 'login'：告诉服务器这是“登录”请求。
                    user_id: parseInt(userId)：把用户ID转成数字发给服务器。
                ​作用​：告诉服务器“我是XXX用户，现在上线了”。
        this.reconnectAttempts记录“尝试重新连接”的次数。
                  = 0;：把重连次数清零（因为成功连接了）。
                作用​：防止无限重连。*/



        // 收到消息时的回调
        this.ws.onmessage = (event) => {
            //异常处理
             try {
                const data = JSON.parse(event.data); // 解析JSON数据
                this.handleMessage(data); // 处理消息
            } catch (e) {
                console.error('WebSocket message error:', e);
            }
        };

        /*this.ws.onmessage = (event) => {​意思​：当收到服务器发来的消息时，执行括号里的代码。
       ​ event.data：服务器发来的原始消息（通常是JSON字符串）。
        JSON.parse()：把字符串转成JavaScript对象（方便操作）。
        const data：存到变量 data 里。
            ​作用​：解析消息（比如 { "action": "new_message", "content": "你好" }）。
       ​   
        this.handleMessage：调用另一个方法（handleMessage）。
        data：把解析后的消息传给它。
        ​作用​：处理具体的消息内容（比如显示在聊天窗口）

        catch (e) { console.error('WebSocket message error:', e); }**​
        ​意思​：如果解析消息出错（比如格式不对），打印错误信息。
        ​作用​：防止程序崩溃，至少能看到错误信息。*/



        // 连接关闭时的回调
        this.ws.onclose = () => {
            setTimeout(() => this.reconnect(), 1000); // 1秒后尝试重连
        };
            /*  this.ws.onclose = () => {**​
            ​意思​：当聊天连接断开时，执行括号里的代码。

            ​setTimeout()：延迟执行一段代码。
            () => this.reconnect()：1秒后调用 reconnect 方法。
            1000：延迟时间（毫秒，1000毫秒=1秒）。
            ​作用​：1秒后自动尝试重新连接。
            */
        // 发生错误时的回调
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    },

        /*this.ws.onerror = (error) => {**​ ​意思​：当连接发生错误时，执行括号里的代码
         console.error('WebSocket error:', error);**​
         ​作用​：在控制台打印错误信息（方便开发者调试）。*/


















    // 发送消息方法
    send: function(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data)); // 发送JSON格式数据
            return true;
        }
        return false;
    },

/*send: function(data) { ... }：send 函数，用来 ​发送数据到服务器​（比如你发一条聊天消息）。
if (this.ws && this.ws.readyState === WebSocket.OPEN) {**​：
  **this.ws**​：检查有没有 WebSocket 连接（ws 是 WebSocket 的缩写）。
  ​**this.ws.readyState === WebSocket.OPEN​：检查连接是不是 ​​“开门营业”状态**​（可以发消息）。
         ​**WebSocket.OPEN**​：表示连接是打开的（可以发送消息）
               (WebSocket.CONNECTING连接中​（正在拨号，还没接通
               WebSocket.CLOSING关闭中​（正在挂断电话，但还没完全挂断）
                WebSocket.CLOSED已关闭​（电话已挂断，无法通信）)。
         ​**this.ws.readyState**​：连接的状态（比如打开、关闭、连接中）。
  ​整行意思​：
  → 如果连接存在 ​并且​ 连接是畅通的，就继续往下执行；否则跳过。

this.ws.send(JSON.stringify(data));**​
  ​**JSON.stringify(data)​：把数据（比如 {text: "你好"}）​变成字符串**​（因为 WebSocket 只能发字符串）。
  ​**this.ws.send(...)​：把字符串数据 ​发送给服务器**。
  ​类比​：
  → 就像你把写好的信（data）装进信封（JSON.stringify），然后塞进邮筒（send）。

return true;**​
​作用​：告诉调用这个函数的人：“消息发送成功啦！”

return false;**​
​作用​：如果连接不存在或没打开，就告诉调用者：“发送失败！”
*/















    // 重连逻辑
    reconnect: function() {
        if (this.reconnectAttempts < 5) { // 最多尝试5次
            this.reconnectAttempts++;
            this.init(); // 重新初始化连接
        } else {
            alert('无法连接到服务器，请刷新页面重试');
        }
    },
/*reconnect: function() { ... }**​
    ​作用​：reconnect 的函数，用来​尝试重新连接服务器​（比如网络断了自动重连）。
    ​类比​：
    → 就像你打电话时突然断线，手机会自动重拨。

 if (this.reconnectAttempts < 5) {**​
    ​**this.reconnectAttempts**​：记录已经尝试重连的次数。
    ​**< 5**​：最多试 5 次（防止无限重连）。
    ​整行意思​：
    → 如果还没试够 5 次，就继续重连；否则放弃。

this.reconnectAttempts++;**​
  ​**++​：把重连次数 ​​+1**​（比如第一次是 1，第二次是 2……）。

this.init();**​
    ​作用​：重新调用 init 函数（就是最初建立 WebSocket 连接的函数）。
    ​类比​：
    → 相当于你挂断电话后，又按了一次“拨打”按钮。


alert('无法连接到服务器，请刷新页面重试');**​
    ​作用​：如果重试 5 次都失败，弹窗提示用户 ​​“没救了，刷新页面吧”​。*/
















    // 在消息容器中添加消息（消息dom渲染）
    appendMessage: function(msg, type) {
        const container = document.getElementById('messageContainer');
        const div = document.createElement('div');
        div.className = `message ${type}`;
        
/* appendMessage: function(msg, type) { ... }**​
​作用​：appendMessage 的函数，用来​在聊天窗口里添加一条新消息​（比如你发了一条消息，或者收到别人的消息）。
​参数​：
msg：消息内容（包含 senderName 和 content，比如 { senderName: "小明", content: "你好！" }）。
type：消息类型（'sent' 表示“我发送的”，'received' 表示“收到的”）
   const container = document.getElementById('messageContainer');**​
​作用​：找到网页上显示聊天消息的 ​容器​（一个 <div> 元素，id 是 messageContainer）。
   const div = document.createElement('div');**​
​作用​：创建一个新的 <div> 元素，用来放这条消息。
  div.className = message ${type};**​
​作用​：给这个 <div> 添加 CSS 类名，方便设置样式。
例如：如果 type 是 'sent'，类名就是 message sent（表示“我发送的消息”）。
​为什么​：这样可以用 CSS 区分“我发的”和“收到的”消息（比如颜色不同）。*/



        // 根据聊天类型和消息类型构建消息头部
        let header = '';
        const isGroupChat = window.currentChat.type === 'group';
/* let（声明可以重复赋值） header = '';**​
​作用​：初始化一个变量 header，用来存消息的“头部”（比如发送者头像和名字）。
​默认值​：空字符串（如果不需要头部，就不显示）。
   const isGroupChat = window.currentChat.type === 'group';**​
​作用​：检查当前是不是 ​群聊​（通过全局变量 window.currentChat.type 判断）（group是群聊，private是私聊）。
​值​：
true：是群聊。
false：是私聊。*/

        // 群聊或接收消息显示发送者信息
        if (isGroupChat || type === 'received') {  //如果是群消息，或者受到的消息，才显示头部的内容，如果是私聊且是自己发送的消息，就什么都没有，不显示头像也没有名字
            header = `
                <div class="message-header">
                    <div class="message-avatar">${String(msg.senderName).charAt(0)}</div>  
                    <div class="message-sender">${isGroupChat && type === 'sent' ? '我' : msg.senderName}</div>
                </div>
            `;
        }

/*if (isGroupChat || type === 'received') { ... }**​
​条件​：如果是群聊 ​或者​ 是收到的消息（received），就显示消息头部（发送者信息）。
​为什么​：
群聊中每条消息都要显示谁发的。
私聊中，只有收到的消息需要显示对方名字（自己发的不用显示“我”）。
   header = （用dom结构后天加上的html内容）
​作用​：构建消息头部的 HTML，包括：
​头像​：取发送者名字的第一个字母（比如“小明” → “小”）。
​名字​：如果是群聊且是自己发的消息，显示“我”；否则显示发送者名字（msg.senderName）。
  */

        // 构建消息HTML并添加到容器
        div.innerHTML = `
            ${header}
            <div class="message-content">${escapeHtml(msg.content)}</div>
        `;
        container.appendChild(div);//将消息真正的显示到网页上（之前还没有显示）
        container.scrollTop = container.scrollHeight; // 滚动到底部
    },


/*  div.innerHTML = ${header}...;**​
​作用​：把消息的 ​头部​ 和 ​内容​ 拼成一个完整的 HTML，放进 <div> 里。
​细节​：
message-content：消息正文（msg.content）。
escapeHtml(msg.content)：防止消息内容中有 HTML 标签（比如 <script>）导致安全问题。
  container.appendChild(div);**​
​作用​：把这条消息的 <div> ​添加到消息容器末尾。
​效果​：网页上会立刻显示这条新消息。
  container.scrollTop = container.scrollHeight;**​
​作用​：自动滚动消息容器到最底部，保证最新消息可见。
​类比​：就像微信聊天时，新消息会自动出现在屏幕底部，不用手动下滑。
  */










    // 处理不同类型的消息
    handleMessage: function(data) {
        if (data.action === 'new_private_message') {
            this.handlePrivateMessage(data.message); // 处理私聊消息
        } else if (data.action === 'new_group_message') {
            this.handleGroupMessage(data.message); // 处理群聊消息
        }
    },

    /*​**handleMessage**​：这是一个函数，用来处理收到的消息数据。
      ​**data**​：参数，表示接收到的消息数据（通常是服务器发来的 JSON 数据） */
    
    /*​**data.action**​：判断消息类型（'new_private_message' 或 'new_group_message'）。
    ​**this.handlePrivateMessage(data.message)**​：如果是私聊消息，调用 handlePrivateMessage 处理。
    ​**this.handleGroupMessage(data.message)**​：如果是群聊消息，调用 handleGroupMessage 处理。*/


    // 处理私聊消息
    handlePrivateMessage: function(message) {
        const currentUserId = parseInt(localStorage.getItem('currentUserId'));
        const chatTargetId = parseInt(window.currentChat.id);
    /*​**message**​：私聊消息的具体内容（如发送者、接收者、消息文本等）。
    ​**localStorage.getItem('currentUserId')**​：从浏览器本地存储中获取当前登录用户的 ID。
    ​**parseInt()**​：把 ID 从字符串转成数字（比如 "123" → 
    ​**window.currentChat.id**​：当前打开的聊天窗口的 ID（可能是私聊对方的用户 ID）。*/

        // 检查是否是当前聊天窗口的消息
        const isCurrentChat = window.currentChat.type === 'private' &&
            (
                (parseInt(message.sender_id) === chatTargetId && parseInt(message.receiver_id) === currentUserId) ||//别人给我发消息时
                //发送者是chatTargetId，接受者是currentUserId，就是发送的是当前要聊天的人（通过window.currentChat那个全局来设置谁是你当前要聊天的人，接收者是我
                (parseInt(message.sender_id) === currentUserId && parseInt(message.receiver_id) === chatTargetId)
            );  
        /*​**window.currentChat.type === 'private'**​：检查当前聊天窗口是不是私聊。
        ​**parseInt(message.sender_id)**​：消息发送者的 ID（转数字）。
        ​**parseInt(message.receiver_id)**​：消息接收者的 ID（转数字）。
        ​逻辑​：
        如果 ​对方发给我​（sender_id=对方，receiver_id=我），或者
        ​我发给对方​（sender_id=我，receiver_id=对方）
        那么这条消息属于当前聊天窗口。*/

        if (isCurrentChat) {
            this.renderMessage(message); // 如果是当前聊天则渲染消息
        }
    },
    /*​**isCurrentChat**​：如果为 true，说明这条消息属于当前聊天窗口。
    ​**this.renderMessage(message)**​：调用 renderMessage 函数，把消息显示在页面上。 */




    // 处理群聊消息
    handleGroupMessage: function(message) {
        const chatId = parseInt(window.currentChat.id);
        /*​**window.currentChat.id**​：当前打开的群聊窗口的 ID（群聊的群 ID）。
         ​**parseInt()**​：转成数字。*/
        // 检查是否是当前群聊的消息
        const isCurrentChat = window.currentChat.type === 'group' &&
            parseInt(message.receiver_id) === chatId;
        /*​**window.currentChat.type === 'group'**​：检查当前聊天窗口是不是群聊。
        ​**parseInt(message.receiver_id) === chatId**​：消息的接收者 ID 是否等于当前群聊 ID（群聊消息的 receiver_id 通常是群 ID）。 */
        if (isCurrentChat) {
            this.renderMessage(message); // 如果是当前群聊则渲染消息
        }
    },
    /*​**isCurrentChat**​：如果为 true，说明这条消息属于当前群聊窗口。
    ​**this.renderMessage(message)**​：调用 renderMessage 显示消息。 */
















    // 渲染消息（类型判断）
    renderMessage: function(rawMsg) {
        const currentUserId = parseInt(localStorage.getItem('currentUserId'), 10);
        const senderId = parseInt(rawMsg.sender_id);
        //这个的目的是把所有人的ID都转成数字，方便与浏览器的数据进行比较

        // 判断消息类型：发送(sent)还是接收(received)
        const type = (senderId === currentUserId) ? 'sent' : 'received';
    /*​**renderMessage**​：函数名，意思是“渲染消息”。
     ​**rawMsg**​：参数，表示从服务器收到的原始消息数据（JSON 格式） */


    /* ​**localStorage.getItem('currentUserId')**​：从浏览器本地存储中获取当前登录用户的 ID（比如 "123"）。
​     **parseInt(..., 10)**​：把字符串转成数字（"123" → 123），10 表示十进制。

     ​**rawMsg.sender_id**​：消息发送者的 ID（比如 "456"）。
     ​**parseInt**​：同样转成数字（"456" → 456）。
            
    **senderId === currentUserId​：如果发送者 ID 等于当前用户 ID，说明这条消息是 ​自己发送的**，否则是 ​别人发送的。
    ​**? 'sent' : 'received'**​：如果是自己发的，type = 'sent'（已发送）；否则 type = 'received'（已接收）。*/

    

        // 获取发送者名称
        let senderName = rawMsg.sender_name || (window.userMap && window.userMap[rawMsg.sender_id]) || `用户${rawMsg.sender_id}`;
    /*​**rawMsg.sender_name**​：如果消息里直接带了发送者名字，就用它。
        ​**window.userMap[rawMsg.sender_id]**​：如果有一个全局的 userMap 存储了用户 ID 和名字的映射，就用它查名字。
        ​**用户${rawMsg.sender_id}**​：如果以上都没有，就用默认名字（比如 用户456）*/
        const msg = {
            type: type,
            sender: senderId,
            senderName: senderName,
            content: rawMsg.content
        };
        this.appendMessage(msg, msg.type); // 添加消息到界面
    }
};
   /*​**msg**​：整理成一个标准的消息对象，包含：
        type：'sent' 或 'received'（自己发的还是别人发的）。
        sender：发送者 ID（数字）。
        senderName：发送者名字（字符串）。
        content：消息内容（rawMsg.content）。
    ​**this.appendMessage**​：调用另一个函数，把整理好的 msg 显示在页面上（具体怎么显示由 appendMessage 实现）。*/

    



// HTML转义函数，防止XSS攻击
function escapeHtml(str) {
    return String(str).replace(/[<>&"]/g, s => ({
        '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;'
    }[s]));
}
/*​**String(str)**​：确保输入是字符串。
​**.replace(/[<>&"]/g, ...)**​：查找所有 <, >, &, " 字符，替换成安全的 HTML 实体：
< → &lt;
> → &gt;
& → &amp;
" → &quot;
​例子​：
输入："<script>"
输出："&lt;script&gt;"（浏览器不会执行，而是直接显示文字）。*/




// 页面加载完成后初始化WebSocket
document.addEventListener('DOMContentLoaded', () => {
    WebSocketManager.init();
    /*​**DOMContentLoaded**​：当 HTML 加载完成（但图片可能还没加载）时触发。
    ​**() => { ... }**​：箭头函数，里面的代码会在页面加载完成后执行。
    WebSocketManager.init()**​：初始化 WebSocket 连接（用于和服务器实时通信）。*/

    // 全局发送消息函数
    window.sendMessage = function() {
        const input = document.querySelector('.message-input');
        const content = input.value.trim();
        if (!content) return; // 空消息不发送
        if (!window.currentChat.id) {
            alert('请先选择联系人或群聊');
            return;
        }
/*​**window.sendMessage**​：定义一个全局函数，任何地方都能调用 sendMessage() 发送消息。
   ​**document.querySelector('.message-input')**​：找到页面上输入消息的输入框（<input class="message-input">）。
​**input.value**​：获取输入框里的文字。
​**.trim()**​：去掉开头和结尾的空格（防止发空白消息）。
  ​**!content**​：如果消息是空的（""），直接返回，不发送。
  ​**!window.currentChat.id**​：如果当前没有选中聊天窗口（比如刚打开页面还没点开聊天），弹窗提示用户。*/

        // 发送消息到服务器
        const success = WebSocketManager.send({
            action: 'send_message',
            sender_id: parseInt(localStorage.getItem('currentUserId')),
            receiver_type: window.currentChat.type,
            receiver_id: parseInt(window.currentChat.id),
            content: content
        });
    /***WebSocketManager.send()**​：调用 WebSocket 的发送方法，把消息传给服务器。
        发送的数据包括：
        action: 'send_message'：告诉服务器这是发送消息的请求。
        sender_id：当前用户 ID（从 localStorage 获取）。
        receiver_type：聊天类型（'private' 私聊 / 'group' 群聊）。
        receiver_id：对方用户 ID 或群 ID（window.currentChat.id）。
        content：消息内容（用户输入的文字）。*/
    
        if (success) {
            input.value = ''; // 清空输入框
        }
    };
    /***success**​：如果消息发送成功（WebSocketManager.send() 返回 true），清空输入框。*/

    // 绑定发送按钮和回车键事件
    document.querySelector('.send-button').addEventListener('click', window.sendMessage);
    /*​**document.querySelector('.send-button')**​：找到发送按钮（<button class="send-button">）。
    8​**.addEventListener('click', window.sendMessage)**​：点击按钮时，调用 sendMessage() 发送消息。*/

    document.querySelector('.message-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            window.sendMessage();
        }
    });
});
    /*​**keypress**​：监听键盘按键事件。
    ​**e.key === 'Enter'**​：如果按的是回车键（Enter）。
    ​**!e.shiftKey**​：并且没有按住 Shift 键（避免 Shift+Enter 换行时误发消息）。
    ​**e.preventDefault()**​：阻止默认行为（比如输入框换行）。
    ​**window.sendMessage()**​：调用发送消息函数。*/















/*关键词	解释（如果你是小白请记住）
data.action	消息类型（私聊 or 群聊）。
currentUserId	你的用户 ID。
window.currentChat	当前打开的聊天窗口信息。
sender_id	消息发送者的 ID。
receiver_id	消息接收者的 ID。
isCurrentChat	这条消息是否属于当前窗口。
renderMessage	把消息显示在页面上。*/


/*​DOM（Document Object Model）​​ 是浏览器把 HTML 转换成的一种 ​树形结构，方便 JavaScript 操作。
​**document**​ 是 DOM 的入口，代表整个网页的根节点。


​**document 的作用**​	​示例代码​	​说明​
​查找元素​	document.querySelector(".class")	通过 class/id 找元素
​修改内容​	element.textContent = "新文字"	        安全修改文本
​监听事件​	button.addEventListener("click", ...)	点击/键盘等交互响应
​创建新元素​	document.createElement("div")	动态添加新内容到页面
​代表整个网页​	document.body                    <body> 的 DOM 对象





document 只代表当前网页的 HTML 内容。
window 是浏览器的全局对象，包含 document、console、localStorage 等所有 JavaScript 可用的功能。
*/






















