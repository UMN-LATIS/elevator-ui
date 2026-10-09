import { computed } from "vue";
import {
  useRoute,
  useRouter,
  type LocationQuery,
  type LocationQueryRaw,
} from "vue-router";
import type { AdminUserListParams, AdminUserType } from "@/types";

const ADMIN_USER_TYPES: readonly AdminUserType[] = ["Local", "Remote"];

export const PER_PAGE_OPTIONS: readonly number[] = [25, 50, 100];
const DEFAULT_PER_PAGE = 100;

function singleValueOf(value: LocationQuery[string]): string | null {
  return typeof value === "string" ? value : null;
}

export function parseUserType(value: string | null): AdminUserType | null {
  return ADMIN_USER_TYPES.find((userType) => userType === value) ?? null;
}

export function parseIsSuperAdmin(value: string | null): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parsePerPage(value: string | null): number {
  const perPage = Number(value);
  return PER_PAGE_OPTIONS.includes(perPage) ? perPage : DEFAULT_PER_PAGE;
}

export function fromUserListQuery(query: LocationQuery): AdminUserListParams {
  return {
    search: singleValueOf(query.search) ?? "",
    userType: parseUserType(singleValueOf(query.userType)),
    isSuperAdmin: parseIsSuperAdmin(singleValueOf(query.isSuperAdmin)),
    page: parsePage(singleValueOf(query.page)),
    perPage: parsePerPage(singleValueOf(query.perPage)),
  };
}

export function toUserListQuery(params: AdminUserListParams): LocationQueryRaw {
  return {
    search: params.search.trim() === "" ? undefined : params.search,
    userType: params.userType ?? undefined,
    isSuperAdmin:
      params.isSuperAdmin === null ? undefined : String(params.isSuperAdmin),
    page: params.page > 1 ? String(params.page) : undefined,
    perPage:
      params.perPage === DEFAULT_PER_PAGE ? undefined : String(params.perPage),
  };
}

export function useUserListParams() {
  const route = useRoute();
  const router = useRouter();

  const params = computed(() => fromUserListQuery(route.query));

  function setParams(changes: Partial<AdminUserListParams>): void {
    router.replace({
      query: toUserListQuery({ ...params.value, page: 1, ...changes }),
    });
  }

  return { params, setParams };
}
