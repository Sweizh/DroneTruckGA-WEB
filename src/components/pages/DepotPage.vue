<template>
  <div class="glass-card p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-bold" style="color: var(--text-primary)">仓库管理</h2>
      <span
        class="text-xs px-2 py-0.5 rounded-full"
        style="background: var(--bg-tertiary); color: var(--text-muted)"
      >{{ depots.length }} 仓库</span>
    </div>

    <div class="space-y-3">
      <div
        v-for="(d, index) in depots"
        :key="index"
        class="rounded-lg p-3"
        style="background: var(--bg-secondary); border: 1px solid var(--border-primary)"
      >
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">仓库ID</label>
            <input
              type="number"
              class="input-field"
              :value="d.id"
              @input="updateDepotField(index, 'id', $event.target.value)"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">X坐标</label>
            <input
              type="number"
              class="input-field"
              :value="d.x"
              @input="updateDepotField(index, 'x', $event.target.value)"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">Y坐标</label>
            <input
              type="number"
              class="input-field"
              :value="d.y"
              @input="updateDepotField(index, 'y', $event.target.value)"
            />
          </div>
        </div>
        <div class="flex justify-end mt-2">
          <button class="btn-ghost" title="删除仓库" @click="deleteDepot(index)">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path>
              <path d="M10 11v6M14 11v6"></path>
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span class="text-xs">删除</span>
          </button>
        </div>
      </div>

      <div
        v-if="depots.length === 0"
        class="text-center py-6 text-sm rounded-lg"
        style="color: var(--text-muted); background: var(--bg-secondary)"
      >
        暂无仓库数据
      </div>
    </div>

    <button class="btn-secondary mt-3" @click="addDepot()">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      添加仓库
    </button>
  </div>
</template>

<script setup>
import { useConfig } from '../../composables/useConfig'

const { config, addDepot, deleteDepot, updateDepotField } = useConfig()

const depots = config.problem.depots
</script>
