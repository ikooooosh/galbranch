let svgNetwork = null;

// 页面加载时自动加载编辑器数据
window.onload = function() {
    setTimeout(() => {
        let savedData = localStorage.getItem("galgame_story_data");
        if (savedData) {
            let data = JSON.parse(savedData);
            if (data.length > 0) {
                renderGraph(data);
            }
        }
    }, 300);
};

// 从编辑器的 localStorage 加载数据
function loadFromEditor() {
    let savedData = localStorage.getItem("galgame_story_data");
    if (!savedData) {
        alert("编辑器中没有数据，请先在编辑器中创建一些节点");
        return;
    }
    let data = JSON.parse(savedData);
    if (data.length === 0) {
        alert("数据为空");
        return;
    }
    renderGraph(data);
}

// 从 JSON 文件加载
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
                let data = JSON.parse(e.target.result);
                if (!Array.isArray(data)) {
                    throw new Error("格式错误");
                }
                renderGraph(data);
            } catch (err) {
                alert("文件格式错误，加载失败");
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

// 渲染连线图（纯 SVG，不依赖任何库）
function renderGraph(data) {
    // 隐藏空提示
    document.getElementById("empty-tip").style.display = "none";

    // 计算节点布局
    let nodesPerRow = 3;
    let spacingX = 260;
    let spacingY = 150;
    let startX = 80;
    let startY = 60;
    let nodeWidth = 220;
    let nodeHeight = 70;

    // 为每个节点计算位置
    let positions = {};
    for (let i = 0; i < data.length; i++) {
        let row = Math.floor(i / nodesPerRow);
        let col = i % nodesPerRow;
        positions[data[i].id] = {
            x: startX + col * spacingX,
            y: startY + row * spacingY
        };
    }

    // 计算总尺寸
    let totalRows = Math.ceil(data.length / nodesPerRow);
    let svgWidth = Math.max(600, startX * 2 + nodesPerRow * spacingX);
    let svgHeight = Math.max(400, startY * 2 + totalRows * spacingY) + 40;

    // 更新统计信息
    document.getElementById("node-count").textContent = data.length;

    let edgeCount = 0;
    for (let i = 0; i < data.length; i++) {
        edgeCount += data[i].choices.filter(c => c.targetId !== null).length;
    }
    document.getElementById("edge-count").textContent = edgeCount;

    // 生成 SVG
    let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + svgWidth + '" height="' + svgHeight + '" style="background:#fafafa;">';

    // 先画连线（在节点下面，避免被遮挡）
    svg += '<defs>';
    svg += '<marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">';
    svg += '<polygon points="0 0, 10 3.5, 0 7" fill="#999" />';
    svg += '</marker>';
    svg += '</defs>';

    for (let i = 0; i < data.length; i++) {
        let node = data[i];
        let fromPos = positions[node.id];
        if (!fromPos) continue;

        for (let j = 0; j < node.choices.length; j++) {
            let choice = node.choices[j];
            if (choice.targetId === null) continue;

            let toPos = positions[choice.targetId];
            if (!toPos) continue;

            // 计算连线起点（节点底部中心）和终点（节点顶部中心）
            let x1 = fromPos.x + nodeWidth / 2;
            let y1 = fromPos.y + nodeHeight;
            let x2 = toPos.x + nodeWidth / 2;
            let y2 = toPos.y;

            // 贝塞尔曲线
            let cy1 = y1 + (y2 - y1) * 0.4;
            let cy2 = y2 - (y2 - y1) * 0.4;
            let pathD = "M " + x1 + "," + y1 + " C " + x1 + "," + cy1 + " " + x2 + "," + cy2 + " " + x2 + "," + y2;

            svg += '<path d="' + pathD + '" fill="none" stroke="#999" stroke-width="2" marker-end="url(#arrowhead)" />';

            // 选项标签放在连线中间偏上位置
            let midX = (x1 + x2) / 2;
            let midY = (y1 + y2) / 2 - 10;
            let label = choice.text.length > 12 ? choice.text.substring(0, 12) + "..." : choice.text;
            svg += '<rect x="' + (midX - label.length * 4 - 6) + '" y="' + (midY - 10) + '" width="' + (label.length * 8 + 12) + '" height="20" rx="4" fill="white" stroke="#ddd" stroke-width="1" />';
            svg += '<text x="' + midX + '" y="' + (midY + 4) + '" text-anchor="middle" font-size="12" fill="#555">' + label + '</text>';
        }
    }

    // 再画节点
    for (let i = 0; i < data.length; i++) {
        let node = data[i];
        let pos = positions[node.id];
        if (!pos) continue;

        let label = node.text.length > 18 ? node.text.substring(0, 18) + "..." : node.text;

        // 节点背景
        svg += '<rect x="' + pos.x + '" y="' + pos.y + '" width="' + nodeWidth + '" height="' + nodeHeight + '" rx="8" fill="#4a90d9" stroke="#357abd" stroke-width="2" cursor="pointer" />';

        // 节点 ID 标签
        svg += '<text x="' + (pos.x + 10) + '" y="' + (pos.y + 22) + '" font-size="11" fill="rgba(255,255,255,0.7)">#' + node.id + '</text>';

        // 节点文本
        svg += '<text x="' + (pos.x + nodeWidth / 2) + '" y="' + (pos.y + 45) + '" text-anchor="middle" font-size="13" fill="white" font-weight="bold">' + label + '</text>';

        // 选项数小标签
        let choiceText = node.choices.length + " 个选项";
        if (node.choices.length === 0) choiceText = "结束";
        svg += '<text x="' + (pos.x + nodeWidth - 10) + '" y="' + (pos.y + nodeHeight - 8) + '" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.6)">' + choiceText + '</text>';

        // 添加透明点击区域（覆盖整个节点）
        svg += '<rect x="' + pos.x + '" y="' + pos.y + '" width="' + nodeWidth + '" height="' + nodeHeight + '" rx="8" fill="transparent" cursor="pointer" onclick="showNodeDetail(' + node.id + ')" />';
    }

    svg += '</svg>';

    // 插入到页面
    document.getElementById("graph").innerHTML = svg;
}

// 显示节点详情（弹窗）
function showNodeDetail(id) {
    let savedData = localStorage.getItem("galgame_story_data");
    if (!savedData) return;
    let data = JSON.parse(savedData);

    let node = null;
    for (let i = 0; i < data.length; i++) {
        if (data[i].id === id) {
            node = data[i];
            break;
        }
    }
    if (!node) return;

    let msg = "【场景文本】\n" + node.text + "\n\n【选项】\n";
    if (node.choices.length === 0) {
        msg += "（无选项，故事结束）";
    } else {
        for (let i = 0; i < node.choices.length; i++) {
            let c = node.choices[i];
            let targetText = "结束";
            for (let j = 0; j < data.length; j++) {
                if (data[j].id === c.targetId) {
                    targetText = data[j].text.substring(0, 20) + "...";
                    break;
                }
            }
            msg += (i + 1) + ". " + c.text + " → " + targetText + "\n";
        }
    }
    alert(msg);
}

// 适应窗口（用 SVG 的 viewBox 做缩放）
function fitGraph() {
    let graphDiv = document.getElementById("graph");
    let svg = graphDiv.querySelector("svg");
    if (svg) {
        let w = parseInt(svg.getAttribute("width"));
        let h = parseInt(svg.getAttribute("height"));
        let container = document.getElementById("graph-container");
        let cw = container.clientWidth;
        let ch = container.clientHeight;
        svg.setAttribute("viewBox", "0 0 " + w + " " + h);
        svg.style.width = "100%";
        svg.style.height = "100%";
    }
}

// 返回编辑器
function goBack() {
    window.location.href = "index.html";
}

// 窗口变化时适配
window.addEventListener("resize", function() {
    fitGraph();
});