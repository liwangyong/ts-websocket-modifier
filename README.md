# ts-websocket-modifier

## 引入

```
import {
  SubscribeMessage, // 订阅消息
  SubscribeCoonectMsg, // 连接消息
  BackWebSocketEmit // WebSocket实例
} from "@/until/webSocket";
```

## 连接 websocket
```
  @SubscribeCoonectMsg()
  updateCoonect(WebsocketEmitUntil?: new (...args: any[]) => any) {
    this.coonectWebsocket =
      new WebsocketEmitUntil(
        url
      );
  }
```

## 触发消息
```
  @SubscribeMessage()
  getWebSocketMsg() {
    subscribeAddMsg += 1;
  }
```
## 实例销毁

```
this.coonectWebsocket?.destroy();
```