import { Peer } from "./Peer";

export class SignallingClient {
  /**
   * Emite um evento para o servidor de sinalização
   * @param {'offer'|'answer'|'icecandidate'} event
   * @param {*} data
   * @param {Peer} from
   * @param {Peer} to
   * @returns {SignallingClient}
   */
  emit(event, data, from, to) {
    throw new Error("Não implementado");
  }

  /**
   * Aguarda um evento do servidor de sinalização
   * @param {'offer'|'answer'|'icecandidate'} event
   * @param {(data, from) => void} listener
   * @returns {SignallingClient}
   */
  on(event, listener) {
    throw new Error("Não implementado");
  }
}
