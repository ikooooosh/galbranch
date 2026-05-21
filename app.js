let currentEditId = null;

// 场景节点列表
let nodes = [
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

function showNode(id) {
    // 找到节点
    let node = null;
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === id) {
            node = nodes[i];
            break;
        }
    }

    // 记录当前编辑的是哪个节点
    currentEditId = id;

    // 生成可编辑界面
    let editorDiv = document.getElementById("editor");
    let html = "<h3>节点编辑</h3>";

    // 场景文本
    html += "<p><b>场景文本：</b></p>";
    html += '<textarea id="edit-text" rows="3" style="width:100%;">' + node.text + '</textarea>';
    
    // 选项列表（可编辑文本 + 下拉选择目标节点）
    html += "<p><b>选项：</b></p>";
    for (let i = 0; i < node.choices.length; i++) {
        let choice = node.choices[i];
        html += "<p>";
        html += '选项文本：<input id="choice-text-' + i + '" value="' + choice.text + '">';
        html += ' → <select id="choice-target-' + i + '">';
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
        html += "</p>";
    }

    // 新增选项按钮 + 保存按钮
    html += '<button onclick="addChoice()">➕ 新增选项</button>';
    html += '<button onclick="saveNode()">保存修改</button>';

    editorDiv.innerHTML = html;
}

function saveNode() {
    // 1. 找到当前编辑的节点
    let node = null;
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === currentEditId) {
            node = nodes[i];
            break;
        }
    }

    // 2. 保存场景文本
    node.text = document.getElementById("edit-text").value;

    // 3. 保存每个选项的文本和目标节点
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

    // 4. 刷新左侧列表
    renderNodeList();

    // 5. 提示保存成功
    alert("已保存！");
}

function addNode() {
    // 找到当前最大的 id
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
}

function addChoice() {
    // 找到当前编辑的节点
    let node = null;
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === currentEditId) {
            node = nodes[i];
            break;
        }
    }

    // 新增一个空选项（目标设为 null 表示结束）
    node.choices.push({
        text: "新选项",
        targetId: null
    });

    // 重新渲染编辑区
    showNode(currentEditId);
}

function deleteChoice(index) {
    // 找到当前编辑的节点
    let node = null;
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === currentEditId) {
            node = nodes[i];
            break;
        }
    }

    // 从选项数组中移除指定位置的选项
    node.choices.splice(index, 1);

    // 重新渲染编辑区
    showNode(currentEditId);
}

function deleteNode(id) {
    // 1. 找到要删除的节点在数组中的位置
    let index = -1;
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === id) {
            index = i;
            break;
        }
    }
    if (index === -1) {
        return;  // 没找到，啥也不做
    }

    // 2. 遍历所有其他节点，把指向被删除节点的选项的 targetId 改成 null
    for (let i = 0; i < nodes.length; i++) {
        if (i === index) continue;  // 跳过自己
        let node = nodes[i];
        for (let j = 0; j < node.choices.length; j++) {
            if (node.choices[j].targetId === id) {
                node.choices[j].targetId = null;
            }
        }
    }

    // 3. 如果当前编辑的就是这个节点，清空右侧编辑区
    if (currentEditId === id) {
        currentEditId = null;
        let editorDiv = document.getElementById("editor");
        editorDiv.innerHTML = "<h3>节点编辑</h3><p>请选择一个有选项的节点</p>";
    }

    // 4. 从数组中移除
    nodes.splice(index, 1);

    // 5. 刷新左侧列表
    renderNodeList();
}

// 调用一次，显示节点列表
renderNodeList();