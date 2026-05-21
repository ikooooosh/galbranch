//场景节点列表
        let nodes = [
            {
                id:1,
                text:"这是第一段剧情",
                choices:[
                    {text:"选项1", targetId:2},
                    {text:"选项2", targetId:3}
                ]
            },
            {
                id:2,
                text:"这是第二段剧情",
                choices:[
                    {text:"选项A", targetId:null},
                    {text:"选项B", targetId:null}
                ]
            },
            {
                id:3,
                text:"这是第三段剧情",
                choices:[]
            }
        ];
        function renderNodeList(){
            let nodeListDiv = document.getElementById("node-list");
            let html = "<h3>节点列表</h3>";
            for(let i=0;i < nodes.length;i++){
                html +='<div>' + nodes[i].text + '</div>'
            }
            nodeListDiv.innerHTML = html;
        }
        //调用一次
        renderNodeList();