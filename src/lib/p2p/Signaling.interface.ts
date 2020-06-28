import { Peer } from "./Peer";

export type SignalingEvent = "offer" | "answer" | "candidate";
export type SignalingSDPListener = (sdp: RTCSessionDescription) => void;
export type SignalingCandidateListener = (candidate: RTCIceCandidate) => void;

export interface ISignaling {
  offer(offer: RTCSessionDescription, peer: Peer): void;
  answer(answer: RTCSessionDescription, peer: Peer): void;
  candidate(candidate: RTCIceCandidate, peer: Peer): void;
  on(
    event: SignalingEvent,
    to: Peer,
    listener: SignalingSDPListener | SignalingCandidateListener
  ): Function;
  off(
    event: SignalingEvent,
    listener: SignalingSDPListener | SignalingCandidateListener
  ): void;
  dispose?(): void;
}
