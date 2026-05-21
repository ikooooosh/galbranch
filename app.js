let currentEditId = null;

// 页面加载时：先从 localStorage 读取，没有才用默认数据
let savedData = localStorage.getItem("galgame_story_data");
let nodes;
if (savedData) {
    nodes = JSON.parse(savedData);
} else {
    nodes = [
        {
            id: 1,
            text: "这是第一段剧情",
            choices: [
                { text: "选项1", targetId: 2 },
                { text: "选项2", targetId: 3 }
            ]
        },
        {
            id: 2,
            text: "这是第二段剧情",
            choices: [
                { text: "选项A", targetId: null },
                { text: "选项B", targetId: null }
            ]
        },
        {
            id: 3,
            text: "这是第三段剧情",
            choices: []
        }
    ];
}

// 保存到 localStorage（每次数据变动都调用这个）
function saveToLocalStorage() {
    localStorage.setItem("galgame_story_data", JSON.stringify(nodes));
}

// 渲染左侧节点列表
function renderNodeList() {
    let nodeListDiv = document.getElementById("node-list");
    let html = "<h3>节点列表</h3>";
    for (let i = 0; i < nodes.length; i++) {
        html += '<div onclick="showNode(' + nodes[i].id + ')">';
        html += nodes[i].text;
        html += ' <span onclick="deleteNode(' + nodes[i].id + ')" style="cursor:pointer;color:red;">×</span>';
        html += '</div>';
    }
    nodeListDiv.innerHTML = html;
}

// 显示节点编辑区
function showNode(id) {
    let node = null;
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === id) {
            node = nodes[i];
            break;
        }
    }

    currentEditId = id;

    let editorDiv = document.getElementById("editor");
    let html = "<h3>节点编辑</h3>";

    html += "<p><b>场景文本：</b></p>";
    html += '<textarea id="edit-text" rows="3" style="width:100%;" oninput="saveNode()">' + node.text + '</textarea>';

    html += "<p><b>选项：</b></p>";
    if (node.choices.length === 0) {
        html += "<p style='color:#999;'>（暂无选项，点击下方按钮新增）</p>";
    } else {
        for (let i = 0; i < node.choices.length; i++) {
            let choice = node.choices[i];
            html += "<p>";
            html += '选项文本：<input id="choice-text-' + i + '" value="' + choice.text + '" oninput="saveNode()">';
            html += ' → <select id="choice-target-' + i + '" onchange="saveNode()">';
            html += '<option value="">结束</option>';
            for (let j = 0; j < nodes.length; j++) {
                let selected = "";
                if (nodes[j].id === choice.targetId) {
                    selected = "selected";
                }
                html += '<option value="' + nodes[j].id + '" ' + selected + '>' + nodes[j].text + '</option>';
            }
            html += '</select>';
            html += ' <span onclick="deleteChoice(' + i + ')" style="cursor:pointer;color:red;">×</span>';
            html += ' <button onclick="jumpToChoice(' + i + ')" style="font-size:12px;">跳转</button>';
            html += "</p>";
        }
    }

    html += '<button onclick="addChoice()">➕ 新增选项</button>';

    editorDiv.innerHTML = html;
}

// 自动保存
function saveNode() {
    let node = null;
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === currentEditId) {
            node = nodes[i];
            break;
        }
    }

    if (!node) return;

    let textEl = document.getElementById("edit-text");
    if (textEl) {
        node.text = textEl.value;
    }

    for (let i = 0; i < node.choices.length; i++) {
        let textInput = document.getElementById("choice-text-" + i);
        let targetSelect = document.getElementById("choice-target-" + i);
        if (textInput) {
            node.choices[i].text = textInput.value;
        }
        if (targetSelect) {
            let val = targetSelect.value;
            node.choices[i].targetId = val === "" ? null : Number(val);
        }
    }

    renderNodeList();
    saveToLocalStorage();  // ★ 自动保存到本地
    showToast("修改已保存");
}

// 右下角提示
let toastTimer = null;
function showToast(message) {
    let oldToast = document.getElementById("toast");
    if (oldToast) {
        oldToast.remove();
    }
    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    let toast = document.createElement("div");
    toast.id = "toast";
    toast.textContent = message;
    toast.style.cssText = "position:fixed;bottom:20px;right:20px;background:#4CAF50;color:white;padding:12px 24px;border-radius:6px;font-size:16px;z-index:9999;box-shadow:0 2px 10px rgba(0,0,0,0.2);";

    document.body.appendChild(toast);

    toastTimer = setTimeout(() => {
        toast.style.transition = "opacity 0.3s";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 1500);
}

// 新增节点
function addNode() {
    let maxId = 0;
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id > maxId) {
            maxId = nodes[i].id;
        }
    }
    let nodeId = maxId + 1;

    let newNode = {
        id: nodeId,
        text: "这是第" + nodeId + "段剧情",
        choices: []
    };
    nodes.push(newNode);
    renderNodeList();
    saveToLocalStorage();  // ★
    if (currentEditId !== null) {
        showNode(currentEditId);
    }
    showToast("已新增节点");
}

// 删除节点
function deleteNode(id) {
    let index = -1;
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === id) {
            index = i;
            break;
        }
    }
    if (index === -1) return;

    for (let i = 0; i < nodes.length; i++) {
        if (i === index) continue;
        let node = nodes[i];
        for (let j = 0; j < node.choices.length; j++) {
            if (node.choices[j].targetId === id) {
                node.choices[j].targetId = null;
            }
        }
    }

    if (currentEditId === id) {
        currentEditId = null;
        let editorDiv = document.getElementById("editor");
        editorDiv.innerHTML = "<h3>节点编辑</h3><p>请选择一个节点</p>";
    }

    nodes.splice(index, 1);
    renderNodeList();
    saveToLocalStorage();  // ★
    showToast("已删除节点");
}

// 新增选项
function addChoice() {
    let node = null;
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === currentEditId) {
            node = nodes[i];
            break;
        }
    }

    if (!node) return;

    node.choices.push({
        text: "新选项",
        targetId: null
    });

    showNode(currentEditId);
}

// 删除选项
function deleteChoice(index) {
    let node = null;
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === currentEditId) {
            node = nodes[i];
            break;
        }
    }

    if (!node) return;

    node.choices.splice(index, 1);
    showNode(currentEditId);
}

// 跳转到选项指向的节点
function jumpToChoice(index) {
    let node = null;
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === currentEditId) {
            node = nodes[i];
            break;
        }
    }

    if (!node) return;

    let targetId = node.choices[index].targetId;

    if (targetId !== null) {
        showNode(targetId);
    } else {
        showToast("该选项指向「结束」，无法跳转");
    }
}

// 导出到文件
function saveToFile() {
    let fileName = prompt("请输入文件名：", "galgame_story");
    if (fileName === null) return;
    if (fileName.trim() === "") {
        fileName = "galgame_story";
    }

    let jsonStr = JSON.stringify(nodes, null, 2);
    let blob = new Blob([jsonStr], { type: "application/json" });
    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = fileName + ".json";
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("已导出到文件");
}

// 从文件加载
function loadFromFile() {
    let input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = function(event) {
        let file = event.target.files[0];
        if (!file) return;

        let reader = new FileReader();
        reader.onload = function(e) {
            try {
                let loadedNodes = JSON.parse(e.target.result);
                if (!Array.isArray(loadedNodes)) {
                    throw new Error("格式错误");
                }

                nodes = loadedNodes;
                saveToLocalStorage();  // ★ 加载后也存到本地

                currentEditId = null;
                let editorDiv = document.getElementById("editor");
                editorDiv.innerHTML = "<h3>节点编辑</h3><p>请选择一个节点</p>";

                renderNodeList();
                showToast("已加载文件");
            } catch (err) {
                showToast("文件格式错误，加载失败");
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

// 页面加载时渲染
renderNodeList();