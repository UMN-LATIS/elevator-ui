import invariant from "tiny-invariant";
import { onMounted, onBeforeUnmount } from "vue";

export interface BroadcastMessage {
  type: string;
  payload: unknown;
}

export const SAVE_RELATED_ASSET_TYPE = "SAVE_RELATED_ASSET" as const;

export interface RelatedAssetSaveMessage extends BroadcastMessage {
  type: typeof SAVE_RELATED_ASSET_TYPE;
  payload: {
    relatedAssetId: string;
  };
}

export const isSaveRelatedAssetMessage = (
  message: BroadcastMessage
): message is RelatedAssetSaveMessage => {
  return message.type === SAVE_RELATED_ASSET_TYPE;
};

export const useBroadcastChannel = <MessageType extends BroadcastMessage>(
  channelName: string
) => {
  const channel = new BroadcastChannel(channelName);
  const listeners = [] as ((message: MessageType) => void)[];

  function handleMessageEvent(event: MessageEvent<MessageType>) {
    const { data } = event;
    if (!data.type || !data.payload) {
      throw new Error("Invalid message format");
    }

    listeners.forEach((listener) => {
      listener(data as MessageType);
    });
  }

  onMounted(() => {
    invariant(channel, "BroadcastChannel is not initialized");
    channel.addEventListener("message", handleMessageEvent);
  });

  onBeforeUnmount(() => {
    invariant(channel, "BroadcastChannel is not initialized");
    channel.removeEventListener("message", handleMessageEvent);
    channel.close();
  });

  return {
    channel,
    onBroadcastMessage(callback: (message: MessageType) => void) {
      listeners.push(callback);
    },
    postBroadcastMessage: channel.postMessage,
  };
};
