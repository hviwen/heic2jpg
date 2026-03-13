export const messages = {
  'zh-CN': {
    app: {
      name: 'HEIC2JPG',
      tagline: '把苹果相册里的 HEIC，变成随时可投递、可分享、可归档的通用图片。'
    },
    nav: {
      home: '工作台',
      history: '历史记录',
      settings: '设置',
      about: '帮助中心',
      newConversion: '新建转换'
    },
    common: {
      anonymous: '匿名模式',
      signIn: 'Google 登录',
      signOut: '退出登录',
      uploading: '上传中',
      light: '浅色',
      dark: '深色',
      auto: '自动',
      language: '语言',
      theme: '主题',
      chinese: '中文',
      english: 'English',
      save: '保存',
      reset: '恢复默认',
      optional: '可选',
      retry: '重试',
      remove: '移除',
      cancel: '取消',
      download: '下载',
      empty: '暂无数据',
      processing: '处理中',
      completed: '已完成',
      failed: '失败',
      pending: '等待中',
      learnMore: '查看说明',
      original: '原始文件',
      converted: '转换结果',
      size: '尺寸',
      format: '格式',
      backHome: '返回首页',
      compression: '压缩率',
      savedSpace: '节省空间'
    },
    auth: {
      signedIn: 'Google 登录成功，后续跨设备能力会沿用当前账号。',
      failed: '登录流程未完成，请稍后重试。',
      reason: '原因',
      ready: '登录后可为后续跨设备历史和平台能力做好准备。'
    },
    home: {
      eyebrow: 'Phase 2 / Studio Refresh',
      title: '像暗房一样处理图片，像工作流一样管理批量任务。',
      description:
        '这次改版把转换流程整理成一个更像产品的工作台：上传、参数、队列、历史和帮助入口都在同一个叙事里。',
      primaryAction: '开始转换',
      secondaryAction: '查看帮助',
      privacy: '浏览器端模式不会上传文件，服务器端模式更适合大批量任务。',
      statsTitle: '实时指标',
      queueTitle: '队列与结果',
      queueSubtitle: '所有文件状态都集中在这里，支持重试、清理和批量下载。',
      uploadTitle: '投放文件',
      uploadSubtitle: '支持拖拽、多选、文件夹上传和粘贴。',
      settingsTitle: '参数台',
      settingsSubtitle: '先从推荐值开始，需要时再展开高级选项。',
      railsTitle: '为什么这样布局',
      rails: [
        '把上传、设置、进度和结果放在同一工作台，避免“跳页式”的割裂感。',
        '默认突出浏览器端隐私叙事，同时保留服务端批处理路径。',
        '将统计、本地历史和帮助入口抬到主流程附近，让页面更像正式产品。'
      ],
      quickFacts: {
        files: '文件数',
        progress: '总进度',
        mode: '当前模式',
        history: '本地历史'
      },
      modes: {
        browser: '本地优先',
        server: '云端加速',
        auto: '自动调度'
      },
      historyTitle: '最近批次',
      historySubtitle: '本地历史只存最近记录，适合快速回看和复用设置。',
      noHistory: '还没有历史记录，完成一次转换后这里会自动出现。',
      supportTitle: '帮助与赞助',
      supportDescription: '如果你正在把这个工具用于团队内协作、内容制作或图片归档，这里会持续补充更完整的使用指南。',
      supportHelp: '查看帮助中心',
      supportSponsor: '支持项目',
      shellNote: 'API 地址、OAuth 回调和本地历史现在都已经接进新的应用壳。'
    },
    upload: {
      title: '把 HEIC / HEIF 文件拖到这里',
      subtitle: '也可以点击选择文件，或者直接拖入整个文件夹。',
      hint: '支持最大 50 个文件，单文件上限 100 MB。',
      paste: '已启用粘贴图片支持',
      folder: '支持文件夹上传',
      button: '选择文件',
      errorTitle: '文件检查未通过'
    },
    settings: {
      modeTitle: '处理路径',
      formatTitle: '输出格式',
      qualityTitle: '画质',
      qualityDescription: '推荐 90%，兼顾细节和文件体积。',
      advanced: '高级选项',
      metadata: '保留 EXIF 元数据',
      metadataHint: '包括拍摄时间、地点等信息。',
      dimensions: '尺寸上限',
      width: '最大宽度',
      height: '最大高度',
      dimensionsHint: '未填写则保持原始尺寸。',
      pageTitle: '设置',
      pageDescription: '将视觉偏好和默认转换参数固定下来，下次打开就能延续工作习惯。',
      behavior: '默认行为',
      behaviorHint: '这些设置会影响后续批次的默认值。',
      notifications: '未来通知能力预留',
      notificationsHint: '当前仅做开关占位，便于后续接入系统通知。'
    },
    history: {
      pageTitle: '历史记录',
      pageDescription: '最近 50 次转换批次会保存在本地，可快速回看成功率、耗时和参数。',
      summaryTotal: '累计批次',
      summaryFiles: '累计文件',
      summarySuccess: '平均成功率',
      latest: '最近完成',
      emptyTitle: '还没有可回看的历史',
      emptyDescription: '完成一次批量转换后，这里会自动展示时间、参数和结果摘要。'
    },
    about: {
      pageTitle: '帮助中心',
      pageDescription: '把常见问题、隐私原则和部署方向放在一个更容易阅读的位置。',
      faqTitle: '常见问题',
      faq: [
        {
          question: '什么时候选浏览器端模式？',
          answer: '单次文件不多、对隐私敏感时，浏览器端更合适，文件不会离开当前设备。'
        },
        {
          question: '什么时候选服务器端模式？',
          answer: '当文件数量或总大小较大时，服务器端模式更稳定，也更适合未来的队列化批处理。'
        },
        {
          question: '登录有什么意义？',
          answer: '当前登录只用于建立最小身份体系，为后续跨设备历史、平台 API 和团队能力预留基础。'
        }
      ],
      principlesTitle: '产品原则',
      principles: [
        '先把上传、转换、下载做稳，再逐步增加平台能力。',
        '默认支持匿名使用，登录不是转换门槛。',
        '隐私与可扩展性并行：浏览器端保护本地处理，服务端为后续批处理和开放 API 铺路。'
      ]
    },
    convert: {
      title: '转换流程已经收进工作台首页。',
      description: '这个路由现在只作为兼容入口保留，新的上传、设置和队列都已经合并回主工作台。'
    },
    notFound: {
      title: '这个页面从托盘里滑走了。',
      description: '链接可能已经过期，路由可能被调整，或者这个界面还没有正式落地。'
    },
    footer: {
      feedback: '反馈建议',
      feedbackTitle: '告诉我们你卡在哪里',
      feedbackPlaceholder: '比如：某类 HEIC 文件转换异常、批量下载还不够顺手、希望支持更多格式……',
      feedbackType: {
        bug: '问题',
        feature: '建议',
        question: '疑问'
      },
      feedbackSent: '感谢反馈，我们已经收到这条建议。',
      links: {
        docs: '帮助中心',
        history: '历史记录',
        settings: '设置',
        sponsor: '支持项目'
      }
    }
  },
  'en-US': {
    app: {
      name: 'HEIC2JPG',
      tagline: 'Turn Apple-friendly HEIC files into portable images that are easy to ship, share, and archive.'
    },
    nav: {
      home: 'Studio',
      history: 'History',
      settings: 'Settings',
      about: 'Help',
      newConversion: 'New batch'
    },
    common: {
      anonymous: 'Guest mode',
      signIn: 'Sign in with Google',
      signOut: 'Sign out',
      uploading: 'Uploading',
      light: 'Light',
      dark: 'Dark',
      auto: 'Auto',
      language: 'Language',
      theme: 'Theme',
      chinese: 'Chinese',
      english: 'English',
      save: 'Save',
      reset: 'Reset',
      optional: 'Optional',
      retry: 'Retry',
      remove: 'Remove',
      cancel: 'Cancel',
      download: 'Download',
      empty: 'No data yet',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
      pending: 'Pending',
      learnMore: 'Read guide',
      original: 'Original',
      converted: 'Converted',
      size: 'Size',
      format: 'Format',
      backHome: 'Back home',
      compression: 'Compression',
      savedSpace: 'Saved space'
    },
    auth: {
      signedIn: 'Google sign-in succeeded. Future cross-device features will build on this account.',
      failed: 'The sign-in flow did not finish. Please try again.',
      reason: 'Reason',
      ready: 'Signing in prepares the account layer for future cross-device history and platform features.'
    },
    home: {
      eyebrow: 'Phase 2 / Studio Refresh',
      title: 'Process images like a darkroom, manage batches like a workflow.',
      description:
        'This refresh turns the converter into a more product-like studio where upload, settings, queue, history, and help live in one narrative.',
      primaryAction: 'Start converting',
      secondaryAction: 'Open help',
      privacy: 'Browser mode keeps files local. Server mode is better for larger batches.',
      statsTitle: 'Live metrics',
      queueTitle: 'Queue and results',
      queueSubtitle: 'Every file state lives in one place, with retry, cleanup, and bulk download controls.',
      uploadTitle: 'Drop files',
      uploadSubtitle: 'Drag files in, paste images, or upload a whole folder.',
      settingsTitle: 'Control deck',
      settingsSubtitle: 'Start from the recommended defaults and only open advanced controls when needed.',
      railsTitle: 'Why this layout',
      rails: [
        'Upload, settings, progress, and results share the same studio surface instead of feeling like separate steps.',
        'Privacy-first browser conversion stays prominent, while server processing remains available for scale.',
        'Metrics, local history, and help are pulled closer to the primary workflow so the app feels more like a product.'
      ],
      quickFacts: {
        files: 'Files',
        progress: 'Progress',
        mode: 'Mode',
        history: 'Local history'
      },
      modes: {
        browser: 'Local first',
        server: 'Cloud boosted',
        auto: 'Auto routing'
      },
      historyTitle: 'Recent batches',
      historySubtitle: 'Local history stores the latest runs so you can quickly revisit outcomes and reuse settings.',
      noHistory: 'No history yet. Finish one batch and it will appear here automatically.',
      supportTitle: 'Help and support',
      supportDescription: 'If you are using this tool for team workflows, content production, or media archiving, this area will keep growing into a fuller guide.',
      supportHelp: 'Open help center',
      supportSponsor: 'Support the project',
      shellNote: 'The API base URL, OAuth callback, and local history now all live inside the refreshed app shell.'
    },
    upload: {
      title: 'Drop HEIC / HEIF files here',
      subtitle: 'You can also click to choose files or drag in a whole folder.',
      hint: 'Up to 50 files, with a 100 MB cap per file.',
      paste: 'Paste support is enabled',
      folder: 'Folder upload is enabled',
      button: 'Choose files',
      errorTitle: 'File check failed'
    },
    settings: {
      modeTitle: 'Processing route',
      formatTitle: 'Output format',
      qualityTitle: 'Quality',
      qualityDescription: '90% is the recommended balance of detail and size.',
      advanced: 'Advanced options',
      metadata: 'Keep EXIF metadata',
      metadataHint: 'Includes capture time, location, and related tags.',
      dimensions: 'Dimension limits',
      width: 'Max width',
      height: 'Max height',
      dimensionsHint: 'Leave empty to preserve the original dimensions.',
      pageTitle: 'Settings',
      pageDescription: 'Lock in visual preferences and default conversion values so the next session starts in a familiar state.',
      behavior: 'Default behavior',
      behaviorHint: 'These settings become the defaults for future batches.',
      notifications: 'Future notification hook',
      notificationsHint: 'This toggle is a placeholder for later system notifications.'
    },
    history: {
      pageTitle: 'History',
      pageDescription: 'The latest 50 batches stay in local storage so you can review success rate, run time, and settings.',
      summaryTotal: 'Total batches',
      summaryFiles: 'Total files',
      summarySuccess: 'Average success',
      latest: 'Latest finished',
      emptyTitle: 'No batches to revisit yet',
      emptyDescription: 'Once you finish a batch, this page will show timing, settings, and outcome summaries automatically.'
    },
    about: {
      pageTitle: 'Help center',
      pageDescription: 'Common questions, privacy principles, and deployment direction live here in a cleaner reading flow.',
      faqTitle: 'FAQ',
      faq: [
        {
          question: 'When should I use browser mode?',
          answer: 'Use it when you care about privacy and your batch is relatively small, because files stay on the current device.'
        },
        {
          question: 'When should I use server mode?',
          answer: 'Use it when file count or total size grows, because server mode is more stable for heavier workloads and future queued jobs.'
        },
        {
          question: 'Why sign in at all?',
          answer: 'The current sign-in flow creates the minimum account layer needed for future cross-device history, APIs, and team features.'
        }
      ],
      principlesTitle: 'Product principles',
      principles: [
        'Stabilize upload, conversion, and download before expanding platform features.',
        'Anonymous usage stays available by default. Sign-in is not a gate.',
        'Privacy and scalability move together: local conversion protects files, server conversion prepares the path for queued processing and APIs.'
      ]
    },
    convert: {
      title: 'Conversion now lives on the studio home.',
      description: 'This route is kept only for compatibility. Upload, settings, and queue management have been merged back into the main studio surface.'
    },
    notFound: {
      title: 'This page slipped out of the tray.',
      description: 'The link may be outdated, the route may have moved, or this surface simply has not been built yet.'
    },
    footer: {
      feedback: 'Send feedback',
      feedbackTitle: 'Tell us where the workflow still feels rough',
      feedbackPlaceholder:
        'For example: a HEIC variant fails, bulk download still feels awkward, or you need support for another format.',
      feedbackType: {
        bug: 'Bug',
        feature: 'Idea',
        question: 'Question'
      },
      feedbackSent: 'Thanks, your feedback has been captured.',
      links: {
        docs: 'Help center',
        history: 'History',
        settings: 'Settings',
        sponsor: 'Support'
      }
    }
  }
} as const

export type AppLocale = keyof typeof messages
