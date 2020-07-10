import marked from "marked";
import { Room } from "./Room";
import { EventEmitter } from "events";
import { PeerInfo } from "../p2p";

type ReplacerFunction = (substring: string, ...args: any[]) => string;

export interface IChatMessage {
  text: string;
  user: Record<string, any>;
  date: Date;
}

type ChatToken = {
  name: string;
  test: RegExp;
  replace: string | ReplacerFunction;
};

export class Chat extends EventEmitter {
  private tokens = [] as ChatToken[];
  public parse: (message: string) => string = marked;

  constructor(private readonly room: Room, public readonly label = "chat") {
    super();

    room.createChannel(label);

    const event = `channel:${label}`;
    room.on(`${event}.text`, (data) =>
      this.handleTextMessage(JSON.parse(data))
    );
    room.on(`${event}.buffer`, (data) => this.handleBufferMessage(data));

    this.tokens = [
      {
        name: "image",
        test: /(https?:\/\/[^\s]+\.(png|jpe?g|webp|gif|svg)([?/][^\s]+)?\b)/g,
        replace: "![$1]($1)",
      },
      {
        name: "youtube",
        test: /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v\=|youtu.be\/)([^\s&/]+)\b/g,
        replace: `<iframe width="2506" height="976" src="https://www.youtube.com/embed/$1" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`,
      },
    ];
  }

  addToken(name: string, test: RegExp, replace: string | ReplacerFunction) {
    this.tokens.push({
      name,
      test,
      replace,
    });
    return this;
  }

  parseMessage(message: string): string {
    message = message
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    this.tokens.forEach((token) => {
      message = message.replace(token.test, token.replace as any);
    });

    return this.parse(message);
  }

  createMessage(message: string, parse: boolean = false): IChatMessage {
    return {
      text: parse ? this.parseMessage(message) : message,
      user: this.room.client?.info as PeerInfo,
      date: new Date(),
    };
  }

  sendMessage(message: string) {
    this.room.send(this.label, JSON.stringify(this.createMessage(message)));
  }

  private handleTextMessage(message: IChatMessage) {
    message.text = this.parseMessage(message.text);
    this.emit("message", message);
  }

  private handleBufferMessage(buffer: ArrayBuffer) {}
}
