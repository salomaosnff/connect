export interface IChatMessage {
  text: string;
  user: Record<string, any>;
  date: Date;
}
