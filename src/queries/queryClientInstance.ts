import { QueryClient } from "@tanstack/vue-query";

// Simple global query client for non-Vue contexts
let globalQueryClient: QueryClient | null = null;

export function setGlobalQueryClient(client: QueryClient) {
  globalQueryClient = client;
}

export function getQueryClientInstance(): QueryClient {
  if (!globalQueryClient) {
    // Create a default client if none was set
    globalQueryClient = new QueryClient();
  }
  return globalQueryClient;
}