import { type Ref, watch, onBeforeUnmount } from "vue";

export interface ResponseMessageEvent<T = unknown> extends MessageEvent {
  data: {
    type: keyof typeof responseTypes;
    payload: T;
  };
}

export interface RequestMessage<T = unknown> {
  type: keyof typeof requestTypes;
  payload?: T;
}

type ResponseHandler = (event: ResponseMessageEvent) => void;

export const requestTypes = {
  SET_PLAY_BOUNDS: "SET_PLAY_BOUNDS",
  GET_SCRUBBER_POSITION: "GET_SCRUBBER_POSITION",
  PAUSE_PLAYER: "PAUSE_PLAYER",
} as const;

export const responseTypes = {
  MEDIAPLAYER_READY: "MEDIAPLAYER_READY",
  CURRENT_SCRUBBER_POSITION: "CURRENT_SCRUBBER_POSITION",
  SET_PLAY_BOUNDS_SUCCESS: "SET_PLAY_BOUNDS_SUCCESS",
  PAUSE_PLAYER_SUCCESS: "PAUSE_PLAYER_SUCCESS",
} as const;

const log = (...args) => console.log("[PARENT] ", ...args);

export function useIframeMessaging(iframeRef: Ref<HTMLIFrameElement | null>) {
  const responseHandlers: ResponseHandler[] = [];

  function handleResponses(event: ResponseMessageEvent) {
    if (event.source !== iframeRef.value?.contentWindow) {
      return;
    }

    if (!event.data?.type) {
      return;
    }

    log("message received:", event.data.type, event.data.payload ?? "", {
      event,
    });
    responseHandlers.forEach((handler) => handler(event));
  }

  const unwatch = watch(iframeRef, () => {
    if (iframeRef.value) {
      window.addEventListener("message", handleResponses);
      unwatch();
    }
  });

  onBeforeUnmount(() => {
    window.removeEventListener("message", handleResponses);
  });

  return {
    postMessage(message: RequestMessage) {
      iframeRef.value?.contentWindow?.postMessage(message, "*");
    },
    addResponseHandler(handler: ResponseHandler) {
      responseHandlers.push(handler);
    },
    destroy() {
      window.removeEventListener("message", handleResponses);
    },
  };
}
