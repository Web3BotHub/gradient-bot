# Gradient network 挂机脚本

## 项目地址：[https://app.gradient.network/](https://app.gradient.network/signup?code=EK8G9A)

## 代理 IP：[https://app.proxy-cheap.com](https://app.proxy-cheap.com/r/ksvW8Z)

## 使用文档：<https://mirror.xyz/0xc3d4b59Dd687746871dABeBeAF41243F7252b7b8/GBVnzYJqWH_lyQ8LxYDXag85bLJCfQgWzpOxTeqH6co>

> 下面不用看

## 单独启动一个代理，用于测试

```bash
sudo APP_USER=example@gmail.com APP_PASS='password' PROXY=socks5://username@password@proxyhost:port node app.js
```

## 使用 Docker 启动

将代理地址保存到 `proxies.txt` 文件中，格式为：

> socks5://username:password@proxyhost:port

然后启动容器：

```bash
docker run -d \
  -e APP_USER=user@mail.com \
  -e APP_PASS=password \
  -v ./proxies.txt:/app/proxies.txt \
  overtrue/gradient-bot
```

注意：`proxies.txt` 路径请替换为正确的路径，或者先 `cd` 到 `proxies.txt` 所在目录再执行 docker run 命令。

## 查看运行日志

```bash
docker ps
```

此命令会列出所有容器，找到对应的容器 ID（"CONTAINER ID" 列对应的值），然后执行：

```bash
docker exec -it <container_id> pm2 logs
```

## 删除容器

```bash
docker rm -f <container_id>
```
