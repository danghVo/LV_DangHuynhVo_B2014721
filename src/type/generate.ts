export interface NewNotifi {
  userUuid: string;
  socketTo: string;
  to: string;
  from: string;
  type: string;
  createTime: { time: string; date: string };
  messageType?: string;
}
