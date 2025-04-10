<template>
  <div class="app">
    <h1>Simple Vue Drag and Drop</h1>

    <section>
      <h1>Draggable Table</h1>
      <p>Use up/down arrows on drag handle to move items within a list.</p>
      <p>Use left/right arrows on drag handle to move items between lists.</p>
      <DragDropContainer groupId="todos" class="lists-container">
        <div v-for="listId in listIds" :key="listId">
          <h2 class="uppercase">{{ listId.split("-").join(" ") }}</h2>
          <DragDropList
            v-model="todos.lists[listId]"
            :listId="listId"
            :nextListId="getNextList(listId)"
            :prevListId="getPrevList(listId)">
            <template #item="{ item }">
              <div class="list-item">{{ item.name }}</div>
            </template>
          </DragDropList>
        </div>
      </DragDropContainer>
    </section>
  </div>
</template>
<script setup lang="ts">
import { computed, reactive } from "vue";
import { DragDropContainer, DragDropList } from ".";
import { HasId } from "./dndTypes";

interface TodoItem extends HasId {
  id: number;
  name: string;
}

interface TodoState {
  groupId: string;
  lists: Record<string, TodoItem[]>;
}

const todos = reactive<TodoState>({
  groupId: "my-group",
  lists: {
    "list-1": [
      {
        id: 1,
        name: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      },
      { id: 2, name: "Item 2" },
      { id: 3, name: "Item 3" },
      { id: 4, name: "Item 4" },
      { id: 5, name: "Item 5" },
      { id: 6, name: "Item 6" },
      { id: 7, name: "Item 7" },
      { id: 8, name: "Item 8" },
    ] as TodoItem[],
    "list-2": [] as TodoItem[],
    "list-3": [] as TodoItem[],
    "list-4": [] as TodoItem[],
  },
});

const listIds = computed(() => Object.keys(todos.lists));
const getNextList = (listId: string) => {
  const index = listIds.value.indexOf(listId);
  return listIds.value[(index + 1) % listIds.value.length];
};

const getPrevList = (listId: string) => {
  const index = listIds.value.indexOf(listId);
  return listIds.value[
    (index - 1 + listIds.value.length) % listIds.value.length
  ];
};
</script>
<style scoped>
.app {
  max-width: 40rem;
  margin: 0 auto;
  padding: 1rem;
  font-family: sans-serif;
  line-height: 1.4;
}

.lists-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.list-item {
  padding: 0.666rem 1rem;
}
</style>
