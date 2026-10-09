<template>
  <AdminLayout>
    <PageContent>
      <PageHeader title="Users" description="Every user across all instances" />

      <DataTable
        :itemName="{ singular: 'user', plural: 'users' }"
        :rows="data?.users ?? []"
        :columns="userColumns"
        :status="status"
        :isFiltered="isFiltered"
        :pagination="pagination"
        @update:page="(page) => setParams({ page })">
        <template #toolbarEnd>
          <InputGroup
            v-model="searchInput"
            label="Search users"
            placeholder="Search users"
            labelHidden
            type="search"
            class="max-w-sm">
            <template #prepend>
              <SearchIcon class="size-4 text-on-surface-variant" />
            </template>
          </InputGroup>
          <SelectGroup
            :modelValue="userTypeChoice"
            label="User type"
            :showLabel="false"
            :options="USER_TYPE_OPTIONS"
            @update:modelValue="filterByUserType" />
          <SelectGroup
            :modelValue="superAdminChoice"
            label="Super admin status"
            :showLabel="false"
            :options="SUPER_ADMIN_OPTIONS"
            @update:modelValue="filterBySuperAdmin" />
        </template>
        <template #cell-user="{ row }">
          <a
            :href="`${BASE_URL}/permissions/editUser/${row.id}`"
            class="text-sm font-medium text-primary underline-offset-2 hover:underline">
            {{ row.displayName || row.username }}
          </a>
          <div v-if="row.displayName" class="text-xs text-on-surface-variant">
            {{ row.username }}
          </div>
        </template>
        <template #cell-email="{ row }">
          <span class="text-sm break-words">{{ row.email }}</span>
        </template>
        <template #cell-emplid="{ row }">
          <span class="text-sm">{{ row.emplid }}</span>
        </template>
        <template #cell-userType="{ row }">
          <span class="text-sm">{{ row.userType }}</span>
        </template>
        <template #cell-instance="{ row }">
          <span class="text-sm">{{ row.instance?.name }}</span>
        </template>
        <template #cell-isSuperAdmin="{ row }">
          <CheckIcon
            v-if="row.isSuperAdmin"
            class="mx-auto size-4 text-primary"
            aria-label="Super admin" />
        </template>
        <template #cell-expires="{ row }">
          <span class="text-sm">{{ expiryLabelOf(row, now) }}</span>
        </template>
        <template #cell-createdAt="{ row }">
          <span class="text-sm">{{ createdDateOf(row) }}</span>
        </template>
      </DataTable>
    </PageContent>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { watchDebounced } from "@vueuse/core";
import { CheckIcon, SearchIcon } from "lucide-vue-next";
import { DataTable } from "@/components/DataTable";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import PageContent from "@/components/PageContent/PageContent.vue";
import PageHeader from "@/components/PageHeader/PageHeader.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import AdminLayout from "@/layouts/AdminLayout.vue";
import config from "@/config";
import { useAdminUsersQuery } from "@/queries/adminUserQueries";
import { expiryLabelOf } from "./expiryLabelOf";
import {
  parseIsSuperAdmin,
  parseUserType,
  useUserListParams,
} from "./userListParams";
import type {
  AdminUser,
  DataTableColumn,
  SelectOption,
  TablePagination,
} from "@/types";

const BASE_URL = config.instance.base.url;
const ALL_OPTION_ID = "all";

const USER_TYPE_OPTIONS: SelectOption[] = [
  { id: ALL_OPTION_ID, label: "All types" },
  { id: "Local", label: "Local" },
  { id: "Remote", label: "Remote" },
];

const SUPER_ADMIN_OPTIONS: SelectOption[] = [
  { id: ALL_OPTION_ID, label: "All users" },
  { id: "true", label: "Super admins" },
  { id: "false", label: "Not super admins" },
];

const userColumns: DataTableColumn<AdminUser>[] = [
  { id: "user", label: "User" },
  { id: "email", label: "Email" },
  { id: "emplid", label: "Emplid", width: "md" },
  { id: "userType", label: "Type", width: "sm" },
  { id: "instance", label: "Instance", width: "md" },
  { id: "isSuperAdmin", label: "Super admin", width: "sm", align: "center" },
  { id: "expires", label: "Expires", width: "md" },
  { id: "createdAt", label: "Created", width: "md" },
];

const now = new Date();

const { params, setParams } = useUserListParams();
const { data, status } = useAdminUsersQuery(params);

const isFiltered = computed(
  (): boolean =>
    params.value.search !== "" ||
    params.value.userType !== null ||
    params.value.isSuperAdmin !== null
);

const userTypeChoice = computed(
  (): string => params.value.userType ?? ALL_OPTION_ID
);

const superAdminChoice = computed((): string => {
  if (params.value.isSuperAdmin === null) return ALL_OPTION_ID;
  return String(params.value.isSuperAdmin);
});

function filterByUserType(choice: string | null): void {
  setParams({ userType: parseUserType(choice) });
}

function filterBySuperAdmin(choice: string | null): void {
  setParams({ isSuperAdmin: parseIsSuperAdmin(choice) });
}

function createdDateOf(user: AdminUser): string | null {
  if (!user.createdAt) return null;
  return new Date(user.createdAt).toLocaleDateString();
}

const pagination = computed((): TablePagination | undefined => {
  if (!data.value) return undefined;
  const { perPage, total } = data.value;
  return { page: params.value.page, perPage, total };
});

watch(
  data,
  (response) => {
    if (!response) return;
    const isPastLastPage = response.users.length === 0 && response.total > 0;
    if (!isPastLastPage) return;
    setParams({ page: Math.ceil(response.total / response.perPage) });
  },
  { immediate: true }
);

const searchInput = ref(params.value.search);

watch(
  () => params.value.search,
  (search) => {
    searchInput.value = search;
  }
);

watchDebounced(
  searchInput,
  (search) => {
    if (search !== params.value.search) setParams({ search });
  },
  { debounce: 300 }
);
</script>
