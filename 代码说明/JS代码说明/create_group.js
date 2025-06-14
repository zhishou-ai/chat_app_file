// 绑定群组创建按钮点击事件
document.querySelector('.group-create-btn').addEventListener('click', function() {
    showCreateGroupModal(); // 显示创建群组模态框
});
/*​**document.querySelector('.group-create-btn')​：找到页面上 ​class="group-create-btn"​**​ 的按钮（比如“创建群组”按钮）。
​**.addEventListener('click', ...)​：监听按钮的 ​点击事件**，点击时执行函数。
​**showCreateGroupModal()**​：调用函数，显示创建群组的弹窗（模态框）。*/

// 显示创建群组模态框
function showCreateGroupModal() {
    const modal = document.querySelector('.group-modal');
    modal.style.display = 'flex'; // 显示模态框
/*showCreateGroupModal 函数（显示创建群组弹窗）​​
​功能​
显示一个弹窗（模态框）。
加载所有用户列表，供用户选择群成员。
绑定“关闭弹窗”和“创建群组”按钮的事件。*/

/*​**document.querySelector('.group-modal')​：找到 ​class="group-modal"​**​ 的弹窗（默认可能是隐藏的）。
​**modal.style.display = 'flex'**​：把弹窗显示出来（flex 是 CSS 布局方式）。*/

    // 加载所有用户（先用下面的函数从后端获取，然后再加载到前端来）
    loadAllUsers().then(users => {
        const container = document.querySelector('.friend-list');
        container.innerHTML = '<h4>选择成员：</h4>';
/*​**loadAllUsers()**​：调用函数，向服务器请求，获取所有用户数据（返回一个 Promise（等服务器的请求返回的未来会完成的任务））。
​**.then(users => { ... })**​：数据加载成功后，执行回调函数，users 是用户列表。
​**document.querySelector('.friend-list')**​：找到弹窗中显示用户列表的区域。
​**container.innerHTML = '<h4>选择成员：</h4>'**​：清空区域，并添加标题“选择成员”。*/

        // 为每个用户创建复选框项
        users.forEach(user => {
            if(user.user_id == localStorage.getItem('currentUserId')) return; // 不显示自己，local……是获取自己的信息。
            
            const div = document.createElement('div');//创建一个新的 <div> 元素，用于包裹每个用户的复选框选项。
            div.className = 'friend-item';   //css类名，方便后期css渲染
            div.innerHTML = `  
                <label>
                    <input type="checkbox" value="${user.user_id}">
                    ${user.username} (ID: ${user.user_id})
                </label>
            `;
            container.appendChild(div);
        });
    });



    /*​**users.forEach(user => { ... })**​：遍历每个用户，动态创建复选框。（循环users数组中每一个用户）
​**if(user.user_id == localStorage.getItem('currentUserId')) return;**​：不显示当前登录用户自己（不能把自己加进群组）。
​**document.createElement('div')**​：创建一个 <div> 元素。
​**div.className = 'friend-item'**​：给这个 <div> 添加 class（用于 CSS 样式）。
​**div.innerHTML = ...**​：设置 <div> 的内容，包括：
​**<input type="checkbox">**​：复选框（用户点击可以选中或取消选中），value 是用户 ID。
​**${user.username} (ID: ${user.user_id})**​：显示用户名和 ID。
label便签是为每个用户生成一个 ​带复选框的选项，用户点击用户名或复选框都能选中。
​**container.appendChild(div)**​：把用户选项添加到列表中。*/



    // 绑定关闭模态框事件
    modal.querySelector('.close-modal').addEventListener('click', () => modal.style.display = 'none');
    modal.querySelector('.cancel-btn').addEventListener('click', () => modal.style.display = 'none');
/*​**modal.querySelector('.close-modal')​：找到弹窗的 ​关闭按钮**​（可能是右上角的 ×）。
​**.addEventListener('click', () => modal.style.display = 'none')**​：点击时隐藏弹窗。
​**modal.querySelector('.cancel-btn')​：找到 ​取消按钮**，点击时同样关闭弹窗。*/


    // 绑定创建群组事件
    modal.querySelector('.create-btn').addEventListener('click', createGroup);
}
/***modal.querySelector('.create-btn')​：找到 ​创建按钮**。
​**.addEventListener('click', createGroup)**​：点击时调用 createGroup() 函数，发送创建群组的请求。
*/


// 获取所有用户（从后端获取）
function loadAllUsers() {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://192.168.3.232:80/history/users');
        xhr.onload = () => {
            if(xhr.status === 200) {
                resolve(JSON.parse(xhr.responseText)); // 解析用户数据
            } else {
                reject();
            }
        };
        xhr.send();
    });
}
/*​**loadAllUsers() 函数是一个 ​异步函数，负责从服务器获取所有用户数据（用于创建群组时选择成员）
​**return new Promise(...)**​：返回一个 Promise（​Pending​进行中（尚未完成）​Fulfilled​已成功完成（拿到结果）​Rejected已失败（出错或超时），用于异步处理（then成功/catch失败）。
​**const xhr = new XMLHttpRequest()**​：创建 HTTP 请求对象（用于和服务器通信）。
​**xhr.open('GET', 'http://192.168.3.232:80/history/users')**​：设置请求方法（GET）和 URL（服务器地址）。
​**xhr.onload = () => { ... }**​：请求完成后执行的回调函数。
​**xhr.status === 200**​：如果请求成功（HTTP 状态码 200），解析返回的 JSON 数据。
​**resolve(JSON.parse(xhr.responseText))**​：成功时返回用户列表。
​**reject()**​：失败时返回错误。
​**xhr.send()**​：发送请求。
*/

// 创建群组
function createGroup() {
    const modal = document.querySelector('.group-modal');
    const groupName = document.getElementById('groupName').value.trim();
    // 获取选中的成员ID
    const checked = Array.from(modal.querySelectorAll('input[type="checkbox"]:checked'))
                      .map(input => parseInt(input.value));  //parseInt转为整数，现在是字符串（网页中永远是字符串），JS要用的是数值
/*createGroup 函数（创建群组）​​
​功能​
获取用户输入的群名称和选中的成员。
验证输入是否合法。
发送请求到服务器，创建群组*/

/*​**document.getElementById('groupName')**​：找到输入群名称的输入框。
​**.value.trim()**​：获取输入的值，并去掉首尾空格。
​**modal.querySelectorAll('input[type="checkbox"]:checked')​：找到所有 ​被选中的复选框**。
​**Array.from(...)**​：把结果转成数组。因为现在是假的数组，无法进行后续map也就是转成整数的操作，所以要先给它转成真的数组
**modal.querySelectorAll()	在 modal 弹窗内查找所有匹配的元素
**'input[type="checkbox"]:checked'	CSS 选择器：选中所有 ​类型是 checkbox 且被勾选​ 的输入框
​**.map(input => parseInt(input.value))**​：
**.map(...)	对数组中的每个元素执行操作，并返回新数组
**input => ...	箭头函数，input 是当前遍历的复选框元素
  提取每个复选框的 value（用户 ID）并转成数字。*/

    // 前端验证
    if (!groupName) {
        showError('请输入群名称');
        return;
    }
    if (groupName.length < 2 || groupName.length > 64) {
        showError('群名称需要2-64个字符');
        return;
    }
    if (checked.length === 0) {
        showError('请至少选择一位成员');
        return;
    }

/*​**if (!groupName)**​：如果群名称是空的，显示错误“请输入群名称”。
​**groupName.length < 2 || groupName.length > 64**​：如果群名称太短或太长，显示错误。
​**checked.length === 0**​：如果没有选中任何成员，显示错误。*/

    // 发送创建群组请求
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://192.168.3.232:80/create_group');
    xhr.setRequestHeader('Content-Type', 'application/json');
    /*​**xhr.open('POST', '...')**​：设置请求方法（POST）和 URL。
​**xhr.setRequestHeader('Content-Type', 'application/json')**​：告诉服务器发送的是 JSON 数据。
**xhr.setRequestHeader()	设置 HTTP 请求头（Request Header）
**'Content-Type'	头字段名，表示“内容类型”
**'application/json'	值，声明数据格式为 JSON*/

    xhr.onload = function() {
        const response = JSON.parse(xhr.responseText || '{}');
        if (xhr.status === 200 && response.success) {
            modal.style.display = 'none'; // 关闭模态框
            // 刷新群组列表
            const groupTab = document.querySelector('[data-type="group"]');
            groupTab.click();
            setTimeout(() => groupTab.click(), 100); // 双重刷新确保数据更新
        } else {
            showError(response.error || '未知错误');
        }
    };

/*​**xhr.onload**​：请求完成后的回调函数。（当操作（如网络请求、图片加载等）​成功完成时，它会自动触发你写的代码。)
​**JSON.parse(xhr.responseText || '{}')**​：解析服务器返回的数据,把JSON字符转成JavaScript对象。
​**xhr.status === 200 && response.success**​：如果请求成功且服务器返回 success=true：
​**modal.style.display = 'none'**​：关闭弹窗。
    .style.display 是 JavaScript 中用来 ​控制 HTML 元素的显示方式​ 的属性。
        "none"	​隐藏元素​（不占空间）	div.style.display = "none"
        "block"	​显示为块级元素​（独占一行）	div.style.display = "block"
        "inline"	​显示为行内元素​（不换行）	span.style.display = "inline"
        "flex"	​弹性布局​（现代常用）	div.style.display = "flex"
        "grid"	​网格布局​	div.style.display = "grid"
**document.querySelector()	查找匹配的第一个元素（返回单个元素）
**'[data-type="group"]'	CSS 属性选择器，匹配 data-type 属性值为 "group" 的元素


​**groupTab.click()**​：模拟点击群组标签页，更方便的刷新列表。
​**setTimeout(() => groupTab.click(), 100)**​：延迟1000毫秒再点一次，确保数据更新。
​**else { showError(...) }**​：如果失败，显示错误信息。*/
    xhr.onerror = function() {
        showError('网络连接失败');
    };
/***xhr.onerror**​：如果请求失败（比如断网），显示“网络连接失败”*/


    // 发送创建群组的数据
    xhr.send(JSON.stringify({
        creator_id: parseInt(localStorage.getItem('currentUserId')),
        group_name: groupName,
        members: checked
    }));
}
/*​**xhr.send(JSON.stringify({ ... }))**​：发送数据给服务器，包括：
​**creator_id**​：当前用户 ID（从 localStorage 获取）。
​**group_name**​：群名称。
​**members**​：选中的成员 ID 列表。*/


// 显示错误信息
function showError(msg) {
    const errorDiv = document.createElement('div'); 
    errorDiv.className = 'error-message';
    errorDiv.textContent = msg;
    
    // 移除已有的错误信息
    const modalBody = document.querySelector('.modal-body');
    const existingError = modalBody.querySelector('.error-message');
    if (existingError) existingError.remove();
    
    modalBody.prepend(errorDiv); // 添加错误信息到顶部
    setTimeout(() => errorDiv.remove(), 3000); // 3秒后自动移除
}

/*
function showError(msg) 函数作用是在页面上动态显示一条错误消息​（比如表单验证失败、网络请求错误等），并在几秒后自动消失。
​**document.createElement('div')**​：创建一个 <div> 元素。
​**errorDiv.className = 'error-message'**​：设置 class（用于 CSS 样式）。
​**errorDiv.textContent = msg**​：设置错误信息文本。（msg是函数参数，表示显示错误消息文本字符串类型）

​**modalBody.querySelector('.error-message')**​：查找是否已有错误信息。
​**modalBody.prepend(errorDiv)**​：把错误信息插入到弹窗顶部。
​**setTimeout(() => errorDiv.remove(), 3000)**​：3 秒后自动移除错误信息。*/







/*http状态码  是​服务器对请求的响应状态​
 10个最常用的状态码​
状态码	名称	何时触发？	前端如何处理？
​200​	OK	请求成功	正常处理返回的数据
​201​	Created	成功创建了新资源（如新建用户）	跳转到新页面或刷新列表
​301​	Moved Permanently	网址已永久迁移（如换域名）	自动跳转到新地址
​304​	Not Modified	内容未修改（缓存有效）	直接使用本地缓存
​400​	Bad Request	请求语法错误（如参数格式不对）	检查提交的数据格式
​401​	Unauthorized	未登录或token过期	跳转到登录页
​403​	Forbidden	无权限访问（如普通用户访问管理员页面）	显示"无权访问"提示
​404​	Not Found	请求的资源不存在	显示404错误页
​500​	Internal Server Error	服务器代码报错	提示用户稍后重试
​503​	Service Unavailable	服务器过载或维护中	显示"服务不可用"维护公告
*/


