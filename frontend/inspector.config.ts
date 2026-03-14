import type { CodeInspectorPluginOptions } from 'code-inspector-plugin'

export const inspectorConfig: CodeInspectorPluginOptions = {
  bundler: 'vite',
  dev: true,
  showSwitch: true,
  hideConsole: false,
  openIn: 'reuse',
  launchType: 'open'
}
