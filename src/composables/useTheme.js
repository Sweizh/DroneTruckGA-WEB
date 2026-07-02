import { ref } from 'vue'

const theme = ref(localStorage.getItem('theme') || 'dark')

function applyTheme() {
  const isDark = theme.value === 'dark' ||
    (theme.value === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}

// 初始化时应用主题
applyTheme()

// 监听系统主题变化（仅 auto 模式生效）
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (theme.value === 'auto') applyTheme()
})

export function useTheme() {
  function setTheme(t) {
    theme.value = t
    localStorage.setItem('theme', t)
    applyTheme()
  }

  return { theme, setTheme }
}
