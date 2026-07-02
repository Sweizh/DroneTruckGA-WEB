<template>
  <div class="glass-card p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-bold" style="color: var(--text-primary)">客户管理</h2>
      <span
        class="text-xs px-2 py-0.5 rounded-full"
        style="background: var(--bg-tertiary); color: var(--text-muted)"
      >{{ customers.length }} 客户</span>
    </div>

    <div class="max-h-[400px] overflow-y-auto rounded-lg" style="background: var(--bg-secondary)">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>X</th>
            <th>Y</th>
            <th>需求</th>
            <th>时间窗</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(c, index) in customers" :key="c.id">
            <td>{{ c.id }}</td>
            <td>
              <input
                type="number"
                class="input-field p-1 text-xs"
                :value="c.x"
                @input="updateCustomerField(index, 'x', $event.target.value)"
              />
            </td>
            <td>
              <input
                type="number"
                class="input-field p-1 text-xs"
                :value="c.y"
                @input="updateCustomerField(index, 'y', $event.target.value)"
              />
            </td>
            <td>
              <input
                type="number"
                class="input-field p-1 text-xs"
                :value="c.demand"
                @input="updateCustomerField(index, 'demand', $event.target.value)"
              />
            </td>
            <td>[{{ c.timeWindow[0] }}, {{ c.timeWindow[1] }}]</td>
            <td>
              <button class="btn-ghost" title="删除客户" @click="deleteCustomer(index)">
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
              </button>
            </td>
          </tr>
          <tr v-if="customers.length === 0">
            <td colspan="6" class="text-center" style="color: var(--text-muted)">暂无客户数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex gap-2 mt-3">
      <button class="btn-secondary" @click="generateRandomCustomers(10)">
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
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
          <path d="M21 3v5h-5"></path>
        </svg>
        随机生成10个
      </button>
      <button class="btn-secondary" @click="addCustomer()">
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
        添加客户
      </button>
    </div>
  </div>
</template>

<script setup>
import { useConfig } from '../../composables/useConfig'

const { config, deleteCustomer, addCustomer, generateRandomCustomers, updateCustomerField } = useConfig()

const customers = config.problem.customers
</script>
