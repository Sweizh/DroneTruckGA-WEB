<template>
  <nav
    class="glass-card md:hidden h-14 flex overflow-x-auto rounded-none border-x-0 border-b-0 flex-shrink-0"
    style="scrollbar-width: none"
  >
    <button
      v-for="item in tabs"
      :key="item.key"
      class="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 min-w-[48px] flex-shrink-0 transition-colors"
      :style="{
        color: activePage === item.key ? 'var(--accent)' : 'var(--text-muted)',
        touchAction: 'manipulation',
      }"
      @click="emit('navigate', item.key)"
    >
      <component :is="item.icon" />
      <span class="text-[10px] whitespace-nowrap">{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup>
import { h, computed } from 'vue'

defineProps({
  activePage: { type: String, default: 'customer' },
})

const emit = defineEmits(['navigate'])

function makeIcon(paths) {
  return () =>
    h(
      'svg',
      {
        width: 18,
        height: 18,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': 2,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      },
      paths.map((p) => h(p.tag, p.attrs))
    )
}

const UsersIcon = makeIcon([
  { tag: 'path', attrs: { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' } },
  { tag: 'circle', attrs: { cx: '9', cy: '7', r: '4' } },
  { tag: 'path', attrs: { d: 'M22 21v-2a4 4 0 0 0-3-3.87' } },
  { tag: 'path', attrs: { d: 'M16 3.13a4 4 0 0 1 0 7.75' } },
])

const DepotIcon = makeIcon([
  { tag: 'path', attrs: { d: 'M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z' } },
  { tag: 'path', attrs: { d: 'M6 18h12' } },
  { tag: 'path', attrs: { d: 'M6 14h12' } },
  { tag: 'path', attrs: { d: 'M6 10h12' } },
])

const TruckIcon = makeIcon([
  { tag: 'path', attrs: { d: 'M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2' } },
  { tag: 'path', attrs: { d: 'M15 18H9' } },
  { tag: 'path', attrs: { d: 'M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14' } },
  { tag: 'circle', attrs: { cx: '17', cy: '18', r: '2' } },
  { tag: 'circle', attrs: { cx: '7', cy: '18', r: '2' } },
])

const DroneIcon = makeIcon([
  { tag: 'path', attrs: { d: 'M12 3L21 19H3L12 3Z' } },
  { tag: 'circle', attrs: { cx: '12', cy: '14', r: '2.5' } },
])

const LaunchIcon = makeIcon([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '6' } },
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '2' } },
])

const ActivityIcon = makeIcon([
  { tag: 'path', attrs: { d: 'M22 12h-4l-3 9L9 3l-3 9H2' } },
])

const AlertIcon = makeIcon([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
  { tag: 'line', attrs: { x1: '12', y1: '8', x2: '12', y2: '12' } },
  { tag: 'line', attrs: { x1: '12', y1: '16', x2: '12.01', y2: '16' } },
])

const ChartIcon = makeIcon([
  { tag: 'path', attrs: { d: 'M3 3v18h18' } },
  { tag: 'path', attrs: { d: 'M7 14l4-4 3 3 5-5' } },
])

const ClipboardIcon = makeIcon([
  { tag: 'rect', attrs: { x: '8', y: '2', width: '8', height: '4', rx: '1', ry: '1' } },
  { tag: 'path', attrs: { d: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2' } },
  { tag: 'path', attrs: { d: 'M9 12h6' } },
  { tag: 'path', attrs: { d: 'M9 16h6' } },
])

const tabs = computed(() => [
  { key: 'customer', label: '客户', icon: UsersIcon },
  { key: 'depot', label: '仓库', icon: DepotIcon },
  { key: 'truck', label: '卡车', icon: TruckIcon },
  { key: 'drone', label: '无人机', icon: DroneIcon },
  { key: 'launch', label: '发射点', icon: LaunchIcon },
  { key: 'ga', label: 'GA参数', icon: ActivityIcon },
  { key: 'penalty', label: '惩罚', icon: AlertIcon },
  { key: 'result', label: '收敛', icon: ChartIcon },
  { key: 'plan', label: '方案', icon: ClipboardIcon },
])
</script>

<style scoped>
nav::-webkit-scrollbar {
  display: none;
}
</style>
