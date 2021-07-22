// import 'reflect-metadata'
interface ManagerOption {
  reconnection?: boolean;
  reconnectionAttempts?: number | "Infinity";
  reconnectionDelay?: number;
}

export class BackWebSocketEmit {
  socket?: WebSocket;
  target: any;
  currtExample; // 当前class 实例
  _reconnectionAttemptsCount = 0; // 累加的次数
  _reconnecStatus = false; // 连接状态
  url: string; // websocket的url
  config = {
    reconnection: true, // 是否重新连接
    reconnectionAttempts: "Infinity", // 连接的次数
    reconnectionDelay: 2000, // 延迟连接时间
    heartInterval: 30000 // 心跳时间间隔
  }; // 基础配置

  cancelHeartRequest?: number;

  static subscribeMessage: (string) => any;

  static subscribeCurrtExample: object;

  static subscribeSendConnect: (BackWebSocketEmit) => any;

  static subscribeSendConnectName: string;

  static subscribeMessageName: string;

  constructor(url: string, config?: ManagerOption) {
    config && Object.assign((this.config, config));
    this.url = url;
    this.websocketConnect();
  }
  // 获取消息
  message(msg: MessageEvent) {
    this._reconnecStatus = true;
    if (msg.data !== "pong") {
      BackWebSocketEmit.subscribeMessage?.call(
        BackWebSocketEmit.subscribeCurrtExample,
        msg
      );
    } else {
      console.log("pong");
      // 连接成功
      this._reconnectionAttemptsCount = 0;
      clearInterval(this.cancelHeartRequest);
      this.creatHeartCheck();
    }
  }

  open(open) {
    this._reconnecStatus = true;
    clearInterval(this.cancelHeartRequest);
    this.creatHeartCheck();
  }
  //  发生错误
  error(err) {
    console.log(err, "err");
  }
  // 关闭
  async close({ code }) {
    this._reconnecStatus = false;
    if (code !== 1000) {
      const { reconnection, reconnectionAttempts } = this.config;
      if (!reconnection) return;
      if (
        typeof reconnectionAttempts === "string" &&
        reconnectionAttempts !== "Infinity"
      ) {
        return;
      } else if (
        reconnectionAttempts !== "Infinity" &&
        reconnectionAttempts < this._reconnectionAttemptsCount
      ) {
        // 超出次数，重连循环失败 🤔
        return;
      }
      console.log('重连次数', this._reconnectionAttemptsCount)
      this._reconnectionAttemptsCount += 1;
      this.restart(this.config.reconnectionDelay);
    }
    this.cancelHeart();
  }
  // 关闭
  destroy() {
    this.socket?.close(1000);
    this.cancelHeart();
  }
  // 连接
  websocketConnect() {
    this.socket = new WebSocket(this.url);
    // 函数声明的时候保证this
    this.socket.onopen = (...agu) => this.open.apply(this, agu);
    this.socket.onmessage = (...agu) => this.message.apply(this, agu);
    this.socket.onerror = (...agu) => this.error.apply(this, agu);
    this.socket.onclose = (...agu) => this.close.apply(this, agu);
  }

  // 心跳
  creatHeartCheck() {
    const { heartInterval } = this.config;
    this.cancelHeartRequest = setTimeout(() => this._reconnecStatus && this.send("ping"), heartInterval);
  }
  // 断开心跳
  cancelHeart() {
    window.clearTimeout(this.cancelHeartRequest);
  }
  // 连接
  send(str: string) {
    this.socket?.send(str);
  }

  // 重启
  restart(time: number) {
    window.setTimeout(async () => {
      this.websocketConnect();
    }, time);
  }
}
// 订阅信息的装饰器
export const SubscribeMessage = () => {
  return (target: any, name: string, descriptor: PropertyDescriptor) => {
    const desc = descriptor.value;
    BackWebSocketEmit.subscribeMessage = desc;
    BackWebSocketEmit.subscribeMessageName = name;
    descriptor.value = function(...agu) {
      descriptor.value = desc.bind(this, agu);
    };
  };
};

// 连接
export const SubscribeCoonectMsg = (url?: string) => {
  return (target: any, name: string, descriptor: PropertyDescriptor) => {
    const desc = descriptor.value;
    BackWebSocketEmit.subscribeSendConnect = desc;
    BackWebSocketEmit.subscribeSendConnectName = name;
    descriptor.value = function(...arg) {
      // 绑定实例
      BackWebSocketEmit.subscribeCurrtExample = this;
      desc.call(this, BackWebSocketEmit, ...arg);
    };
  };
};
