# Proxy

format:

```bash
http://username:password@host:port
```

command:

```bash
sudo APP_USER=example@gmail.com APP_PASS='password' ALLOW_DEBUG=True PROXY=socks5://username@password@proxyhost:port node app.js
```

docker:

将代理地址保存到 `proxies.txt` 文件中，格式为：

> socks5://username:password@proxyhost:port

然后启动容器：

```bash
docker run -d \
  -e APP_USER=user@mail.com \
  -e APP_PASS=password \
  -v ./proxies.txt:/app/proxies.txt \
  web3bothub/gradient-bot
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
