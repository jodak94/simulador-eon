import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from "rxjs";
declare var SockJS;
declare var Stomp
@Injectable({
  providedIn: 'root'
})
export class SimuladorService {

  constructor() {
    this.initializeWebSocketConnection();
  }
  public stompClient;
  public msg: Subject<any> = new Subject<any>();
  initializeWebSocketConnection() {
    const serverUrl = 'http://localhost:8080/socket';
    const ws = new SockJS(serverUrl);
    this.stompClient = Stomp.over(ws);
    this.stompClient.debug = null
    const that = this;
    this.stompClient.connect({}, function(frame) {
      that.stompClient.subscribe('/message', (message) => {
        that.msg.next(JSON.parse(message.body))
      });
    });
  }

  sendMessage(message) {
    this.stompClient.send('/app/simular' , {}, JSON.stringify(message));
  }
}
