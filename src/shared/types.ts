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

// 提示词节点接口
export interface PromptNode {
  id: string;
  title: string;
  prompt?: string;
  children?: PromptNode[];
  category?: string;
  tags?: string[];
  description?: string;
  usageCount?: number;
  createdAt?: string;
  updatedAt?: string;
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