// 页面加载完成后初始化
//这一块负责监听用户是否登录
document.addEventListener('DOMContentLoaded', function() {
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) {
        window.location.href = '/init/sign_in'; // 未登录跳转到登录页
        return;
    }
    /*​**document**​：代表整个网页的文档对象，可以理解为"整个网页"
​**addEventListener**​：添加事件监听器的方法，意思是"当某个事件发生时做什么"
​**'DOMContentLoaded'**​：这是一个事件名称，表示"当HTML文档完全加载和解析完成时"
​**function() { ... }**​：这是一个匿名函数（没有名字的函数），当事件发生时就会执行这个函数里的代码
​整行意思​：当网页完全加载完成后，执行后面这个函数里的代码*/


    /*​**const**​：声明一个不可变的变量（常量）
​**currentUserId**​：变量名，表示"当前用户ID"
​**localStorage**​：浏览器提供的本地存储对象，可以保存数据（关闭浏览器后还在）
​**getItem**​：从本地存储中获取数据的方法
​**'currentUserId'**​：要获取的数据的键名
​整行意思​：从浏览器本地存储中获取名为'currentUserId'的值，并赋值给currentUserId变量*/

/*​**window.location.href**​：控制浏览器地址栏的URL
​**'/init/sign_in'**​：登录页面的路径
​整行意思​：如果用户未登录，就把页面跳转到登录页*/

    window.currentChat = { id: null, type: 'private' }; // 当前聊天状态
/*​**window.currentChat**​：在全局window对象上创建一个属性
​**{ id: null, type: 'private' }**​：一个对象，包含两个属性：
id: null：表示当前没有选中任何聊天
type: 'private'：默认聊天类型是私聊
​整行意思​：初始化一个全局变量来记录当前的聊天状态*/

    // 初始化事件监听器
    initEventListeners();
/*initEventListeners**​：调用这个函数（后面定义的）
​整行意思​：执行初始化所有事件监听器的函数*/

    // 初始加载
    loadContactLists('private'); // 加载私聊联系人​loadContactLists​：调用加载联系人列表的函数。private：参数，表示要加载私聊联系人
    loadChatMessages(); // 加载聊天消息（虽然还没选中具体聊天，但会显示加载状态）
    updateUserInfo(); // 更新用户信息 获取并显示当前登录用户的信息
});



     添加WebSocket监听器 - 自动刷新消息
    WebSocketManager.addMessageListener((type) => {
    /*WebSocketManager 这是一个websocket的工具包，包含自动重连，断线重连，缓存未发送消息功能
    这里就是直接内置了这些功能了。
    然后addmessage就是一个监听事件执行type这个里面，也就是下面的东西时，就刷新聊天消息*/
    
        if (window.currentChat.id) {//如果变量的ID变了，变成了有，就刷新相应的聊天记录
            loadChatMessages(); // 刷新当前聊天消息
        }
    });
    
    // 添加WebSocket监听器 - 自动刷新联系人
    WebSocketManager.addContactListener((type) => {
        const activeTab = document.querySelector('.contact-tab-item.active');
        if (activeTab) {//当这个变量存在且为真值时执行下面代码
            loadContactLists(activeTab.dataset.type); // 刷新当前显示的联系人列表
        }
        //document.queryselector这个是查找，后面的是搜索内容：就是联系人列表
        //const就是只有当activetab，也就是网页正在操作这个括号里的东西时，才进行刷新。
    });
    
    // 添加定时刷新 - 每5分钟刷新一次联系人列表作为保底
    setInterval(() => {//setinterval创建一个定时器
        const activeTab = document.querySelector('.contact-tab-item.active');
        if (activeTab) {
            loadContactLists(activeTab.dataset.type);
        }
    }, 5 * 60 * 1000); // 5分钟





    
// 初始化事件监听器
function initEventListeners() {
/*​**function**​：声明一个函数
​**initEventListeners**​：函数名，表示"初始化事件监听器"
​整行意思​：定义一个名为initEventListeners的函数*/

    // 联系人选中和未选中时的状态
    document.querySelectorAll('.contact-tab-item').forEach(tab => {
        tab.addEventListener('click', function() {
/* ​**document.querySelectorAll**​：选择所有匹配的元素
    ​**'.contact-tab-item'**​：CSS选择器，选择class为contact-tab-item的元素
    ​**forEach**​：遍历数组或类数组的每个元素
    ​**tab => { ... }**​：箭头函数，对每个tab元素执行操作
    ​整行意思​：找到所有联系人标签页，并对每个标签页执行后面的操作*/
/*​**addEventListener**​：添加事件监听器
    ​**'click'**​：监听点击事件
    ​**function() { ... }**​：点击时执行的函数
    ​整行意思​：给每个标签页添加点击事件监听器*/

            // 移除所有活动标签
            document.querySelectorAll('.contact-tab-item').forEach(t => 
                t.classList.remove('active'));
                /*​**classList.remove('active')**​：移除元素的active类
​整行意思​：移除所有联系人标签页的active类（取消所有标签的选中状态）*/

            this.classList.add('active'); // 设置当前标签为活动状态
            loadContactLists(this.dataset.type); // 加载对应类型的联系人
        });
    });
}
      /*​**this**​：指当前被点击的元素
​**classList.add('active')**​：给元素添加active类
​整行意思​：给当前点击的标签页添加active类（设置为选中状态）*/
     /*​**this.dataset.type**​：获取元素的data-type属性值
​**loadContactLists**​：调用加载联系人列表的函数
​整行意思​：根据标签的data-type属性值（如'private'或'group'）加载对应类型的联系人*/


// 渲染联系人列表，就是遍历网页里的联系人列表，存进渲染容器里，然后通过css进行渲染，过程中不渲染自己,同时设置渲染后清空，方便新的内容渲染。
function renderContactList(data, type) {
    window.userMap = window.userMap || {}; // 用户映射表
/***renderContactList**​：函数名，表示"渲染联系人列表"
    ​**data**​：参数，表示要渲染的联系人数据（数组）
    ​**type**​：参数，表示联系人类型（'user'或'group'*/
/*​**window.userMap**​：创建一个全局对象来存储用户信息
    ​**|| {}**​：如果userMap不存在就初始化为空对象*/

    // 将用户信息存入映射表
    data.forEach(item => {
        window.userMap[item.user_id] = item.username || item.group_name;//usermap的作用是浏览器一直显示着渲染后的元素，不会消失
    });
    /*​**forEach**​：遍历data数组中的每个联系人
​**item.user_id**​：用户的唯一ID
​**item.username || item.group_name**​：使用用户名或群名（兼容私聊和群聊）*/
    const container = document.querySelector('.contact-items');
    container.innerHTML = '';
    /*获取联系人列表的容器元素
清空容器内容（防止重复渲染）：innerHTML就是所有HTML内的内容。=''就是删除的意思*/
    const currentUserId = localStorage.getItem('currentUserId');
    /*再次获取当前用户ID（用于过滤自己）*/


    // 过滤掉自己
    const filtered = data.filter(item => {
        if (type === 'user' || type === 'private') {
            return String(item.user_id) !== String(currentUserId);
        }
        return true;
    });
    /***filter**​：过滤掉当前用户自己（私聊列表不需要显示自己）
     ​**String()**​：确保ID比较时类型一致*/




    // 渲染每个联系人，通过从dataset获取用户ID和type（类型）然后填充到前段的容器里
    filtered.forEach(item => {
        const div = document.createElement('div'); //创建一个新的div，方便后期css进行渲染
        div.className = 'contact-item';//对应css的内容
        div.dataset.id = item[type + '_id'];
        div.dataset.type = type;
        div.innerHTML = `
            <div class="contact-avatar">${item.username?.charAt(0) || item.group_name?.charAt(0)}</div>  
            <div class="contact-info">
                <div class="contact-name">${item.username || item.group_name}</div>
            </div>
        `;
        /*​**.forEach**​：对数组中的每个元素做同样的事情   ​**item**​：当前正在处理的联系人（就像点名时喊到的同学）
        ​**.dataset**​：用来存储自定义数据（就像在纸上写小笔记）
                    ​**id**​：笔记的标题是"id"
                    ​**item[type + '_id']**​：
                    如果type是'user'，就取item.user_id
                    如果type是'group'，就取item.group_id
         div.dataset.type = type：再写一条笔记，标题是"type"，内容是当前的type值
         ​**innerHTML**​：给div填充内容（就像在白纸上画画）
                    ​**`...`**​：模板字符串（可以换行写HTML）
                    ​**${}**​：里面可以写JavaScript表达式
                    ​**?.**​：安全操作符（如果前面是null/undefined就不继续了）
                    ​**charAt(0)**​：取名字的第一个字（比如"张三"取"张"）
                    ​**||**​：如果前面是空值就用后面的（双保险）*/
            
            

        // 点击联系人事件
        div.addEventListener('click', function() {
/*​**addEventListener**​：给div装一个"点击感应器"
​**'click'**​：监听点击事件（就像给div贴了个按钮） */

            // 设置当前选中联系人
            document.querySelectorAll('.contact-item').forEach(i => i.classList.remove('active'));
            /*找到所有联系人，去掉他们的active类（取消所有高亮）*/

            this.classList.add('active');
            /*​**this**​：当前被点击的联系人div，给它添加active类（变成高亮状态）*/
            window.currentChat = {   //用这个是为了，通过 window.…… 让后端知道消息应该发给谁。
                id: this.dataset.id,
                type: type === 'user' ? 'private' : 'group'
            };
            /*更新全局的currentChat对象：
            ​**id**​：从data-id笔记里读取
            ​**type**​：如果是用户就是私聊，群组就是群聊*/

            loadChatMessages(); // 加载聊天消息
            updateChatHeader(); // 更新聊天标题
        });
        
        container.appendChild(div);
        /*把这个联系人div放到联系人列表容器里（把画好的纸贴到公告栏）*/
    });
}

// 更新聊天窗口标题
function updateChatHeader() {
    const header = document.querySelector('.chat-title');
    /*找到页面中class为chat-title的元素（聊天窗口的标题栏）*/
    const activeItem = document.querySelector('.contact-item.active');
    /*找到当前被选中的联系人（有active类的那个）*/
    if (activeItem) {
        header.textContent = activeItem.querySelector('.contact-name').textContent;
    }
}
/*​如果有选中的联系人​：
在联系人内部找到contact-name元素（从前端，标有active类的里找）
获取它的文字内容
把这个内容设置成聊天窗口的标题*/

// 加载联系人列表
function loadContactLists(type) {
    /*​**loadContactLists**​：函数名，意思是"加载联系人列表"
​**type**​：参数，表示要加载的类型（'private'私聊或'group'群聊）*/

    const container = document.querySelector('.contact-items');
    container.innerHTML = '<div class="loading">加载中...</div>';
/*​**innerHTML**​：设置容器内部的内容
显示"加载中..."的提示（类似微信加载时的转圈圈）*/

    let url;//声明一个变量，用来存请求地址  
    if (type === 'private') {
        url = 'http://192.168.3.232:80/history/users';//显示这个地址是给后端的服务器接口，为了方便后端加载通过这个地址去寻找
    } else {
        const userId = localStorage.getItem('currentUserId');
        url = `http://192.168.3.232:80/history/groups?user_id=${userId}`;//这个是群聊的显示地址
    }
    /***localStorage**​：浏览器的小仓库（可以长期存东西）
        ​**getItem**​：从小仓库取东西
        ​**'currentUserId'**​：要取的用户ID
        整句：从浏览器仓库取出标签为'currentUserId'的值，放到userId盒子里*/
/***${userId}**​：把userId变量的值插到字符串里
         * 在URL中：
        ?：表示后面要带参数
        user_id=123：参数名=参数值
        多个参数用&连接，比如：
        ?user_id=123&page=1*/

    // 发送XHR到浏览器，请求获取联系人的信息（不显示到前端）
    const xhr = new XMLHttpRequest();//XMLHttpRequest 用于在不刷新页面的情况下与服务器交换数据
    xhr.open('GET', url, true);
    /*​**open**​：配置请求
        'GET'：请求方法（获取数据）
        url：请求地址
        true：异步请求（不会卡住页面）*/
    xhr.onreadystatechange = function() {
        /**onreadystatechange**​：当请求状态变化时
    XMLHttpRequest 的 5 个阶段详解：
    readyState 值	阶段名称	通俗比喻	触发时机
​0​	UNSENT (未初始化)	快递员还没上班	new                    XMLHttpRequest() 创建后
​1​	OPENED (已打开)	快递员接单，知道送货地址	                xhr.open() 调用后
​2​	HEADERS_RECEIVED (收到响应头)	快递站已揽收，知道包裹大小	服务器返回响应头时
​3​	LOADING (加载中)	包裹正在运输中	                       接收响应体数据时
​4​	DONE (完成)	包裹已送达你家门口	                            所有数据接收完毕
        */
       //请求完后的显示到前端
        if (xhr.readyState === 4) {//是否连接成功的状态，4是请求完成时
            if (xhr.status === 200) {
                /*​**status**​：HTTP状态码（服务器返回的）
                ​**200**​：成功（快递完好无损）
                404：找不到（送错地址了）
                500：服务器错误*/
                const data = JSON.parse(xhr.responseText);
                /***responseText**​：服务器返回的原始数据（JSON字符串）
​                 **JSON.parse**​：把JSON字符串转成JavaScript对象*///改成JS可识别的，是为了方便前端能使用返回来的数据
                renderContactList(data, type === 'private' ? 'user' : 'group');
                /*​**`renderContact**​：调用渲染函数
                如果type === 'private'，第二个参数传'user'  否则传'group'*/
            } else {
                showError('加载失败: ' + xhr.status);//xhr.status显示错误信息（包含状态码）  比如：加载失败: 404)
            }
        }
    };
    xhr.onerror = function() {//当网络完全不通时（快递员迷路了）：触发onerror  显示"网络错误"
        showError('网络错误');
    };
    xhr.send();
    
}

// 加载聊天消息-向后端发送调取聊天记录请求
function loadChatMessages() {//​作用​：加载并显示聊天消息  ​触发时机​：当用户点击某个聊天会话时调用
    const container = document.getElementById('messageContainer');
    //​**document.getElementById**​：通过ID找到显示消息的HTML元素
    container.innerHTML = '<div class="loading">加载消息中...</div>';
  //​**innerHTML**​：清空容器并显示加载动画（类似微信的"正在加载..."提示）它可解析html便签可添加

    const xhr = new XMLHttpRequest(); //对服务器创建一个新的请求
    xhr.open('POST', 'http://192.168.3.232:80/history/messages', true);   //请求到后端服务器的历史记录的接口，true就是说是否卡住一直到请求加载完成，true就是不卡住界面
    xhr.setRequestHeader('Content-Type', 'application/json');  //告诉服务器以JSON的形式发给后端
    /*​作用​：告诉服务器"我要发送JSON格式的数据" ​如果不设置​：服务器可能无法正确解析请求体
​常见Content-Type​：
application/json：JSON数据 
 application/x-www-form-urlencoded：表单数据
multipart/form-data：文件上传*/
    
    xhr.onreadystatechange = function() {//作用​：当请求状态变化时触发（类似快递员打电话汇报进度）
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const messages = JSON.parse(xhr.responseText);//​**JSON.parse**​：将JSON字符串转为JS对象
                processMessages(messages); // 处理消息数据（区分发送接受）
                renderChatMessages(messages); // 渲染消息
            } else {
                showError('消息加载失败: ' + xhr.status);
            }
        }
    };
    /*用户点击聊天会话到页面，页面发送请求（post）到服务器，服务器返回消息数据到页面（json），
    页面在处理消息（processMessages）在渲染消息（renderChatMessages) */
    
    // 发送具体的请求数据
    const postData = JSON.stringify({//创建一个 JSON 格式的字符串，作为要发送给服务器的数据。
        userId: localStorage.getItem('currentUserId'),// 当前登录用户的ID
        chatId: window.currentChat.id,                 // 当前聊天窗口的ID（私聊对方用户ID或群聊ID）
        type: window.currentChat.type,                 // 聊天类型（'private'私聊或'group'群聊）
        page: 1,                                       // 请求第1页的消息
        pageSize: 50                                   // 每页加载50条消息
        
    });/* ​**userId**​：从浏览器的本地存储（localStorage）中获取当前登录用户的 ID。
        **chatId​ 和 ​type**​：从全局变量 window.currentChat 中获取当前聊天会话的 ID 和类型。
​       **page 和 pageSize**​：分页参数，用于控制服务器返回的消息数量（这里是请求最新的50条消息）。
localStorage 是浏览器提供的​本地存储​机制，可以让你在用户的浏览器中​持久化存储数据
它只能存储 ​字符串​（但可以用 JSON.stringify() 存对象）。
每个网站（域名）有自己独立的 localStorage，不同网站之间 ​不能互相访问
​只能存字符串，存对象要用 JSON.stringify()，取回时用 JSON.parse()*/
    
    xhr.send(postData);//发送
}

// 处理消息数据
function processMessages(messages) {
//processMessages主要作用是处理原始消息数据，为每条消息添加两个重要属性：sender（发送者名称）和 type（消息类型）
    const currentUserId = parseInt(localStorage.getItem('currentUserId'), 10);
/*localStorage.getItem('currentUserId')：从浏览器本地存储获取当前登录用户的ID
parseInt(..., 10)：将获取的ID字符串转换为十进制数字（如"123" → 123）*/
    messages.forEach(msg => {
    // 设置发送者名称 messages：传入的消息数组 forEach：对数组中的每条消息执行相同操作
        msg.sender = msg.sender_name || window.userMap[msg.sender_id] || `用户${msg.sender_id}`;
 /*设置消息类型（发送或接收）
第一尝试：msg.sender_name（消息中直接包含的发送者名称）
第二尝试：window.userMap[msg.sender_id]（从全局用户映射表中查找）
最后回退：`用户${msg.sender_id}`（使用"用户+ID"作为默认名称）*/
        msg.type = (parseInt(msg.sender_id) === currentUserId) ? 'sent' : 'received';
    });
}/*这是一个三元表达式，判断消息是"我发送的"还是"我接收的"：
parseInt(msg.sender_id)：将消息中的发送者ID转为数字
=== currentUserId：与当前用户ID比较
 'sent'（已发送）'received'（已接收）*/

// 渲染聊天消息
function renderChatMessages(messages) {//renderChatMessages是负责将聊天消息渲染到页面上
    const container = document.getElementById('messageContainer');
    container.innerHTML = '';
    
    const reversedMessages = [...messages].reverse(); // 反转消息顺序（从旧到新）

    reversedMessages.forEach(msg => {//为消息创建一个HTML元素，方便后期css进行渲染
        const div = document.createElement('div');
        div.className = `message ${msg.type}`;
    
        // 构建消息头部（根据聊天类型和消息类型）
        let header = '';
        const isGroupChat = window.currentChat.type === 'group';//判断是否是群聊消息
        
        if (isGroupChat && msg.type === 'received') {     //判断是否是发送者，只有是别人发的才显示发送者信息（名称ID）
            // 群聊接收消息：显示发送者信息
            header = `
                <div class="message-header">
                    <div class="message-avatar">${msg.sender?.charAt(0) || ''}</div>   
                    <div class="message-sender">${msg.sender || ''}</div>   
                </div>
               `;
             //上面是头像，下面是发送者

        } else if (isGroupChat && msg.type === 'sent') {
            // 群聊自己发送的消息
            header = `
                <div class="message-header">
                    <div class="message-avatar">${msg.sender?.charAt(0) || ''}</div>
                    <div class="message-sender">我</div>
                </div>
                
            `;
        } else if (msg.type === 'received') {
            // 私聊接收消息
            header = `
                <div class="message-header">
                    <div class="message-avatar">${msg.sender?.charAt(0) || ''}</div>
                    <div class="message-sender">${msg.sender || ''}</div>
                </div>
            `;
        }
        //如果是私聊消息，设置对方的头像和名称

        // 为所有的消息构建HTML，方便css统一渲染
        div.innerHTML = `
            ${header}
            <div class="message-content">${msg.content}</div>
        `;

        container.appendChild(div);  //前面的所有消息只是存储到内存里，但是并没有真的显示在网页上，用户还看不到，这一步才是真正的显示在网页里
    });

    container.scrollTop = container.scrollHeight; // 让消息强行滚动到底部，不然加载了一堆消息，你就得从第一个开始看 
}

// 更新用户信息（如果用户更新了的话，比如更新头像）
function updateUserInfo() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `http://192.168.3.232:80/history/user_info?id=${localStorage.getItem('currentUserId')}`, true);//向服务器获取完整的用户信息
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const user = JSON.parse(xhr.responseText);
            // 更新用户界面显示
            document.querySelector('.user-name').textContent = user.username;
            document.querySelector('.user-avatar').textContent = user.username.charAt(0);
        }
    };
    
    xhr.send();
}

// 显示错误信息（定义了显示错误这个函数，如果需要显示错误的位置可以调用这个函数）
function showError(msg) {
    const container = document.getElementById('messageContainer');
    container.innerHTML = `<div class="error">${msg}</div>`;
}