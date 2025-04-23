import { ref, onBeforeUnmount } from "vue";

interface RelatedAssetMessage {
  type: "new-related-asset";
  targetAssetId: string;
}

/**
 * Helps parent and child browser windows pass messages
 * about any newly created related assets.
 */
export function useRelatedAssetChannel() {
  const channel = ref<BroadcastChannel | null>(null);

  /**
   * Generate a unique channel name for related asset communication
   */
  const getChannelName = (
    parentAssetId: string | null,
    contentItemId: string
  ): string => {
    return `related-asset-update-${parentAssetId}-${contentItemId}`;
  };

  /**
   * Setup a listener for receiving related asset updates
   */
  const listenForRelatedAsset = (
    parentAssetId: string | null,
    contentItemId: string,
    onNewAsset: (assetId: string) => void
  ) => {
    // Close any existing channel
    closeChannel();

    const channelName = getChannelName(parentAssetId, contentItemId);
    channel.value = new BroadcastChannel(channelName);

    channel.value.onmessage = (event: MessageEvent<RelatedAssetMessage>) => {
      if (
        event.data &&
        event.data.type === "new-related-asset" &&
        event.data.targetAssetId
      ) {
        onNewAsset(event.data.targetAssetId);
      }
    };

    return closeChannel;
  };

  /**
   * Send a notification about a newly created related asset
   */
  const notifyNewRelatedAsset = (
    channelName: string,
    targetAssetId: string
  ) => {
    // Create a temporary channel for sending
    const tempChannel = new BroadcastChannel(channelName);

    // Send the message
    tempChannel.postMessage({
      type: "new-related-asset",
      targetAssetId,
    });

    // Close the channel
    tempChannel.close();
  };

  /**
   * Close the broadcast channel
   */
  const closeChannel = () => {
    if (channel.value) {
      channel.value.close();
      channel.value = null;
    }
  };

  // Clean up the channel when component is unmounted
  onBeforeUnmount(closeChannel);

  return {
    getChannelName,
    listenForRelatedAsset,
    notifyNewRelatedAsset,
    closeChannel,
  };
}
