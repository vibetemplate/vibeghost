// 代理配置接口
export interface ProxyConfig {
  enabled: boolean;
  host: string;
  port: number;
  type: 'http' | 'socks5';
  auth?: {
    username: string;
    password: string;
  };
}

// 网站配置接口
export interface SiteConfig {
  id: string;
  name: string;
  url: string;
  proxy?: ProxyConfig;
  injectionSelector: string;
  loginRequired: boolean;
  icon?: string;
}

// 新的提示词库结构定义
export interface Chapter {
  id: string
  category: string
  name: string
  prompt: string
}

export interface Project {
  id: string
  name: string
  chapters: Chapter[]
}

// IPC通信事件类型
export interface IPCEvents {
  'inject-prompt': string;
  'get-prompts': void;
  'update-proxy': ProxyConfig;
  'switch-site': string;
  'get-site-config': void;
  'update-site-config': SiteConfig;
}

// 应用配置接口
export interface AppConfig {
  defaultSite: string;
  windowBounds: {
    width: number;
    height: number;
    x?: number;
    y?: number;
  };
  sidebarWidth: number;
  theme: 'light' | 'dark' | 'system';
  proxy: ProxyConfig;
  sites: SiteConfig[];
}

// 注入结果接口
export interface InjectionResult {
  success: boolean;
  error?: string;
  message?: string;
}

// 网站信息接口
export interface WebsiteInfo {
  id: string;
  name: string;
  url: string;
  description?: string;
  icon?: string;
  category: string;
  tags?: string[];
  isActive?: boolean;
}

// 网站分类接口
export interface WebsiteCategory {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  websites: WebsiteInfo[];
}

// 日志条目接口
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  details?: any;
}

// 应用设置接口扩展
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
  logLevel: 'info' | 'warn' | 'error' | 'debug';
  maxLogEntries: number;
  autoSaveConfig: boolean;
  showLogPanel: boolean;
  defaultCategory: string;
}

// AI标签页接口
export interface AITab {
  id: string;
  websiteId: string;        // 对应网站ID
  websiteName: string;      // 显示名称
  websiteIcon: string;      // 网站图标emoji
  url: string;              // 网站URL
  title?: string;           // 页面标题
  isActive: boolean;        // 是否为活跃标签
  isLoading: boolean;       // 是否正在加载
  webContentsId?: number;   // Electron WebContents ID
  createdAt: Date;          // 创建时间
  lastActivatedAt?: Date;   // 最后激活时间
}

// 标签页管理器状态
export interface TabManagerState {
  tabs: AITab[];
  activeTabId: string | null;
  maxTabs: number;
}

// 浏览器导航状态
export interface BrowserNavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  currentUrl: string;
  title: string;
}

// Tab操作事件类型
export type TabAction = 
  | { type: 'CREATE_TAB'; payload: { website: WebsiteInfo } }
  | { type: 'CLOSE_TAB'; payload: { tabId: string } }
  | { type: 'SWITCH_TAB'; payload: { tabId: string } }
  | { type: 'UPDATE_TAB'; payload: { tabId: string; updates: Partial<AITab> } }
  | { type: 'REORDER_TABS'; payload: { fromIndex: number; toIndex: number } }

// Tab相关的IPC事件
export interface TabIPCEvents {
  'create-tab': { website: WebsiteInfo };
  'close-tab': { tabId: string };
  'switch-tab': { tabId: string };
  'get-tabs': void;
  'tab-created': AITab;
  'tab-closed': { tabId: string };
  'tab-updated': { tabId: string; updates: Partial<AITab> };
  'navigation-state-changed': { tabId: string; state: BrowserNavigationState };
}

export interface ElectronAPI {
  getTabs: () => Promise<{ tabs: AITab[], activeTabId: string | null }>
  createTab: (website: WebsiteInfo) => Promise<{ success: boolean, tab?: AITab, error?: string }>
  closeTab: (tabId: string) => Promise<{ success: boolean, error?: string }>
  switchTab: (tabId: string) => Promise<{ success: boolean, error?: string }>
  navigateTab: (tabId: string, action: 'back' | 'forward' | 'reload' | 'stop' | 'navigate', url?: string) => Promise<{ success: boolean, error?: string }>
  on: (channel: string, listener: (...args: any[]) => void) => void
  off: (channel: string, listener: (...args: any[]) => void) => void
  getPrompts: () => Promise<any>
  injectPrompt: (prompt: string) => Promise<{ success: boolean, error?: string }>
}