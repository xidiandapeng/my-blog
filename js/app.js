// ================================================================
// app.js — 博客核心逻辑文件（美化版 v2）
// 功能：页面路由、文章列表渲染、文章详情渲染、分类页渲染、归档页渲染、
//       关于页渲染、搜索功能、主题切换（日/夜间）、回到顶部按钮控制、
//       首页 Hero 横幅、文章卡片渐变封面、渐入动画
// 依赖：posts.js（提供 POSTS 数组）、index.html（提供 #app 容器和导航栏）
// ================================================================


// ==================== 全局状态 ====================

// 当前激活的导航项名称，用于高亮导航栏当前标签（值为 'home' / 'categories' / 'archive' / 'about' / 'post'）
var currentNav = 'home';

// 搜索关键词缓存，当用户在搜索框输入时更新，用于过滤文章列表
var searchKeyword = '';


// ==================== 配置常量 ====================

// COVER_GRADIENTS — 文章卡片封面渐变色对数组
// 每篇文章按 id 取模分配一组渐变色，让卡片封面颜色各异、视觉丰富
var COVER_GRADIENTS = [
  ['#4CAF96', '#2D8C77'],   // 薄荷绿渐变
  ['#5B8DEF', '#3A6FD8'],   // 天蓝渐变
  ['#F093FB', '#C44FE0'],   // 紫粉渐变
  ['#F6D365', '#FDA085'],   // 暖橙渐变
  ['#43E97B', '#38A169'],   // 翠绿渐变
  ['#FA709A', '#FE5E7E'],   // 玫红渐变
  ['#30CFD0', '#2193B0'],   // 青蓝渐变
  ['#A8EDEA', '#7FCBCB']    // 浅青渐变
];

// CATEGORY_ICONS — 分类对应的 Emoji 图标映射
// 渲染分类卡片时根据分类名匹配对应图标，增加视觉趣味
var CATEGORY_ICONS = {
  '技术': '💻',
  '随笔': '✍️',
  '生活': '🌿',
  '读书': '📚',
  '游记': '✈️',
  '默认': '📝'
};

// HERO_EMOJIS — Hero 横幅随机 Emoji 列表，每次进首页随机一个
var HERO_EMOJIS = ['🍃', '🌿', '🌸', '🎯', '✨', '📖', '🚀', '☀️'];


// ==================== 工具函数 ====================

/**
 * HTML 转义函数 — 将特殊字符转义，防止 XSS 攻击
 * @param {string} str - 需要转义的原始字符串
 * @return {string} 转义后的安全字符串
 */
function escapeHtml(str) {
  // 如果传入的不是字符串类型，先转换为字符串
  if (typeof str !== 'string') str = String(str);
  // 使用正则替换将 & < > " ' 五个特殊字符分别替换为 HTML 实体
  return str
    .replace(/&/g, '&amp;')   // 替换 & 为 &amp;
    .replace(/</g, '&lt;')    // 替换 < 为 &lt;
    .replace(/>/g, '&gt;')    // 替换 > 为 &gt;
    .replace(/"/g, '&quot;')  // 替换 " 为 &quot;
    .replace(/'/g, '&#39;');  // 替换 ' 为 &#39;
}

/**
 * 格式化日期 — 将 "2026-08-01" 转为 "2026年8月1日" 的中文格式
 * @param {string} dateStr - 日期字符串，格式 YYYY-MM-DD
 * @return {string} 格式化后的中文日期字符串
 */
function formatDate(dateStr) {
  // 按 "-" 分割日期字符串，得到 [年份, 月份, 日]
  var parts = dateStr.split('-');
  // 返回中文格式日期，parseInt 去除前导零
  return parseInt(parts[0]) + '年' + parseInt(parts[1]) + '月' + parseInt(parts[2]) + '日';
}

/**
 * 获取排序后的文章列表（按 id 降序，即最新文章排前面）
 * @return {Array} 排序后的文章数组（新数组，不修改原 POSTS）
 */
function getSortedPosts() {
  // 使用 slice() 复制一份 POSTS 数组，避免直接修改原始数据
  return POSTS.slice().sort(function(a, b) {
    // 比较两篇文章的 id，b.id - a.id 实现降序排列
    return b.id - a.id;
  });
}

/**
 * 获取文章的封面渐变色 — 根据文章 id 取模分配
 * @param {number} id - 文章 id
 * @return {string} CSS linear-gradient 字符串
 */
function getCoverGradient(id) {
  // 用 id 对渐变数组长度取模，得到一个索引
  var idx = (id - 1) % COVER_GRADIENTS.length;
  // 获取该索引对应的色对
  var pair = COVER_GRADIENTS[idx];
  // 返回 CSS 渐变字符串
  return 'linear-gradient(135deg, ' + pair[0] + ' 0%, ' + pair[1] + ' 100%)';
}

/**
 * 获取分类对应的 Emoji 图标
 * @param {string} category - 分类名称
 * @return {string} Emoji 字符串
 */
function getCategoryIcon(category) {
  // 如果映射中有该分类，返回对应 Emoji；否则返回默认 Emoji
  return CATEGORY_ICONS[category] || CATEGORY_ICONS['默认'];
}


// ==================== 导航高亮控制 ====================

/**
 * 设置导航栏高亮状态 — 移除所有导航链接的 active 类，再给当前页加上
 * @param {string} navName - 要高亮的导航项名称
 */
function highlightNav(navName) {
  // 更新全局当前导航状态
  currentNav = navName;
  // 获取所有拥有 nav-link 类的元素
  var links = document.querySelectorAll('.nav-link');
  // 遍历每一个导航链接，移除 active 类
  for (var i = 0; i < links.length; i++) {
    links[i].classList.remove('active');
  }
  // 查找 data-nav 属性等于 navName 的导航链接并加上 active 类
  var activeLink = document.querySelector('.nav-link[data-nav="' + navName + '"]');
  // 如果找到了对应的导航链接
  if (activeLink) {
    // 为该导航链接添加 active 类以高亮显示
    activeLink.classList.add('active');
  }
}


// ==================== 渐入动画控制 ====================

/**
 * 为页面中所有 .fade-in 元素添加可见动画
 * 使用 IntersectionObserver 监听元素是否进入视口，进入后添加 .visible 类
 */
function applyFadeIn() {
  // 获取所有拥有 fade-in 类的元素
  var elements = document.querySelectorAll('.fade-in');
  // 创建 IntersectionObserver 实例（现代浏览器均支持）
  var observer = new IntersectionObserver(function(entries) {
    // 遍历所有被观察的元素状态变化
    for (var i = 0; i < entries.length; i++) {
      // 如果元素进入了视口
      if (entries[i].isIntersecting) {
        // 添加 visible 类触发渐入动画
        entries[i].target.classList.add('visible');
        // 观察一次后不再继续观察该元素（一次性动画）
        observer.unobserve(entries[i].target);
      }
    }
  }, {
    // 元素底部进入视口 50px 时触发
    rootMargin: '0px 0px -50px 0px',
    // 可见度阈值为 0.1（10% 可见即触发）
    threshold: 0.1
  });
  // 遍历所有 fade-in 元素，逐一注册到观察器
  for (var j = 0; j < elements.length; j++) {
    observer.observe(elements[j]);
  }
}


// ==================== 页面渲染函数 ====================

/**
 * 渲染文章卡片网格 — 根据传入的文章数组生成卡片 HTML
 * @param {Array} posts - 要渲染的文章数组
 * @return {string} 生成的 HTML 字符串
 */
function renderPostList(posts) {
  // 如果文章数组为空，返回"暂无文章"的提示信息
  if (posts.length === 0) {
    return '<div class="empty-state"><p>没有找到相关文章 😢</p></div>';
  }

  // 开始构建 HTML，外层为网格容器
  var html = '<div class="post-grid">';
  // 遍历文章数组中的每一篇文章
  for (var i = 0; i < posts.length; i++) {
    // 获取当前文章对象
    var post = posts[i];
    // 获取该文章的封面渐变色
    var gradient = getCoverGradient(post.id);
    // 卡片开始，添加 fade-in 类用于渐入动画
    html += '<article class="post-card fade-in" onclick="showPost(' + post.id + ')">';
    // 卡片封面色块（渐变背景 + 大 Emoji）
    html += '<div class="post-cover" style="background: ' + gradient + ';">';
    // 封面内显示分类对应的 Emoji 大图标
    html += getCategoryIcon(post.category);
    // 封面结束
    html += '</div>';
    // 分类标签 — 绝对定位在封面左上角
    html += '<span class="post-category" onclick="event.stopPropagation(); showCategory(\'' + escapeHtml(post.category) + '\')">' + escapeHtml(post.category) + '</span>';
    // 卡片正文区域开始
    html += '<div class="post-body">';
    // 卡片标题
    html += '<h3 class="post-title">' + escapeHtml(post.title) + '</h3>';
    // 卡片元信息：发布日期
    html += '<div class="post-meta"><span>📅 ' + formatDate(post.date) + '</span></div>';
    // 卡片摘要文本
    html += '<p class="post-excerpt">' + escapeHtml(post.excerpt) + '</p>';
    // 卡片底部标签列表
    html += '<div class="post-tags">';
    // 遍历该文章的所有标签
    for (var j = 0; j < post.tags.length; j++) {
      // 每个标签可点击，点击后调用 showTag 筛选
      html += '<span class="tag" onclick="event.stopPropagation(); showTag(\'' + escapeHtml(post.tags[j]) + '\')">#' + escapeHtml(post.tags[j]) + '</span>';
    }
    // 标签容器结束
    html += '</div>';
    // 卡片正文区域结束
    html += '</div>';
    // 文章卡片结束
    html += '</article>';
  }
  // 网格容器结束
  html += '</div>';
  // 返回拼接完成的 HTML 字符串
  return html;
}

/**
 * 渲染首页 — Hero 横幅 + 文章网格
 */
function renderHome() {
  // 高亮导航栏的"首页"按钮
  highlightNav('home');
  // 获取按 id 降序排列的文章列表
  var posts = getSortedPosts();
  // 统计分类数量
  var categoryCount = {};
  // 遍历所有文章统计分类
  for (var i = 0; i < POSTS.length; i++) {
    categoryCount[POSTS[i].category] = (categoryCount[POSTS[i].category] || 0) + 1;
  }
  // 随机选一个 Hero Emoji
  var heroEmoji = HERO_EMOJIS[Math.floor(Math.random() * HERO_EMOJIS.length)];

  // 构建首页 HTML
  var html = '';

  // ==== Hero 横幅区域 ====
  html += '<section class="hero">';
  // Hero 顶部 Emoji
  html += '<span class="hero-emoji">' + heroEmoji + '</span>';
  // Hero 大标题
  html += '<h2 class="hero-title">清风博客</h2>';
  // Hero 副标题简介
  html += '<p class="hero-subtitle">记录技术笔记与生活随笔，在代码与文字之间寻找平衡</p>';
  // Hero 统计数字行
  html += '<div class="hero-stats">';
  // 文章总数
  html += '<div class="hero-stat"><div class="hero-stat-num">' + posts.length + '</div><div class="hero-stat-label">篇文章</div></div>';
  // 分类总数
  html += '<div class="hero-stat"><div class="hero-stat-num">' + Object.keys(categoryCount).length + '</div><div class="hero-stat-label">个分类</div></div>';
  // 标签总数（去重统计）
  var allTags = [];
  for (var t = 0; t < POSTS.length; t++) {
    for (var t2 = 0; t2 < POSTS[t].tags.length; t2++) {
      if (allTags.indexOf(POSTS[t].tags[t2]) === -1) allTags.push(POSTS[t].tags[t2]);
    }
  }
  html += '<div class="hero-stat"><div class="hero-stat-num">' + allTags.length + '</div><div class="hero-stat-label">个标签</div></div>';
  // Hero 统计行结束
  html += '</div>';
  // Hero 区域结束
  html += '</section>';

  // ==== 文章列表区域 ====
  // 小标题
  html += '<h3 class="page-title">最新文章</h3>';
  html += '<p class="page-subtitle">共 ' + posts.length + ' 篇文章</p>';
  // 插入文章卡片网格
  html += renderPostList(posts);

  // 将 HTML 写入 #app 容器
  document.getElementById('app').innerHTML = html;
  // 滚动到页面顶部
  window.scrollTo(0, 0);
  // 触发渐入动画
  applyFadeIn();
}

/**
 * 渲染文章详情页 — 展示单篇文章的完整内容
 * @param {number} id - 文章的 id
 */
function renderPost(id) {
  // 高亮导航栏（文章页不高亮任何导航项）
  highlightNav('post');
  // 在 POSTS 数组中查找 id 匹配的文章
  var post = null;
  // 遍历所有文章
  for (var i = 0; i < POSTS.length; i++) {
    // 如果当前文章的 id 等于要查找的 id
    if (POSTS[i].id === id) {
      // 找到目标文章，保存引用
      post = POSTS[i];
      // 跳出循环
      break;
    }
  }
  // 如果没找到对应文章，显示提示
  if (!post) {
    document.getElementById('app').innerHTML = '<div class="empty-state"><p>文章不存在 😢</p><a href="#" onclick="showHome(); return false;">返回首页</a></div>';
    return; // 结束函数
  }

  // 构建文章详情页 HTML
  var html = '';
  // 详情页外层容器（限宽）
  html += '<div class="post-detail-wrap">';
  // "返回首页"链接
  html += '<a href="#" class="back-link" onclick="showHome(); return false;">← 返回首页</a>';
  // 文章详情容器开始
  html += '<article class="post-detail">';
  // 文章分类标签
  html += '<span class="post-category" style="position:static;background:var(--tag-bg);color:var(--primary);">' + escapeHtml(post.category) + '</span>';
  // 文章大标题
  html += '<h1 class="post-detail-title">' + escapeHtml(post.title) + '</h1>';
  // 文章元信息行：日期 + 分类
  html += '<div class="post-detail-meta"><span>📅 ' + formatDate(post.date) + '</span><span>📁 ' + escapeHtml(post.category) + '</span></div>';
  // 文章标签列表
  html += '<div class="post-tags">';
  // 遍历标签数组
  for (var j = 0; j < post.tags.length; j++) {
    // 每个标签可点击筛选
    html += '<span class="tag" onclick="showTag(\'' + escapeHtml(post.tags[j]) + '\')">#' + escapeHtml(post.tags[j]) + '</span>';
  }
  // 标签容器结束
  html += '</div>';
  // 文章正文内容（content 字段为 Markdown 语法，用 marked.parse() 解析为 HTML 后再插入）
  // 检查 marked 库是否已加载，若已加载则解析 Markdown，否则直接显示原文兜底
  var contentHtml = '';
  if (typeof marked !== 'undefined') {
    // 安全配置：marked 默认会原样保留 Markdown 中的 HTML 标签，
    // 这里通过包装一层 sanitize 过滤来移除潜在的恶意标签（如 <script>、onerror= 等）
    // 先用 marked.parse() 将 Markdown 转为 HTML
    var rawHtml = marked.parse(post.content);
    // 再用 DOMParser 解析后移除危险的标签和属性（XSS 防护）
    var doc = new DOMParser().parseFromString(rawHtml, 'text/html');
    // 移除所有 <script> 标签
    doc.querySelectorAll('script').forEach(function(el) { el.remove(); });
    // 移除所有 on* 事件属性（如 onclick、onerror 等）
    doc.querySelectorAll('*').forEach(function(el) {
      // 遍历元素的所有属性
      Array.from(el.attributes).forEach(function(attr) {
        // 如果属性名以 on 开头（事件处理属性），删除
        if (attr.name.toLowerCase().startsWith('on')) {
          el.removeAttribute(attr.name);
        }
        // 如果是 href 或 src 属性且值为 javascript: 协议，删除
        if ((attr.name.toLowerCase() === 'href' || attr.name.toLowerCase() === 'src') &&
            attr.value.toLowerCase().trim().startsWith('javascript:')) {
          el.removeAttribute(attr.name);
        }
      });
    });
    // 获取净化后的 HTML 字符串
    contentHtml = doc.body.innerHTML;
  } else {
    // marked 未加载时的兜底：用 <pre> 保留原始 Markdown 文本
    contentHtml = '<pre>' + escapeHtml(post.content) + '</pre>';
  }
  // 将解析后的 HTML 插入文章正文容器
  html += '<div class="post-content">' + contentHtml + '</div>';
  // 文章详情容器结束
  html += '</article>';
  // 外层容器结束
  html += '</div>';

  // 将 HTML 写入 #app 容器
  document.getElementById('app').innerHTML = html;
  // 滚动到页面顶部
  window.scrollTo(0, 0);

  // 如果 highlight.js 已加载，对详情页中的代码块执行语法高亮
  if (typeof hljs !== 'undefined') {
    // 对页面中所有 <pre><code> 元素执行高亮
    hljs.highlightAll();
  }
}

/**
 * 渲染分类页 — 按分类分组展示所有文章（带图标的三列卡片网格）
 */
function renderCategories() {
  // 高亮导航栏的"分类"按钮
  highlightNav('categories');
  // 构建分类统计对象
  var categoryMap = {};
  // 遍历所有文章，统计每个分类下的文章数量
  for (var i = 0; i < POSTS.length; i++) {
    var cat = POSTS[i].category;
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  }

  // 构建 HTML
  var html = '';
  // 页面标题
  html += '<h3 class="page-title">文章分类</h3>';
  // 副标题
  html += '<p class="page-subtitle">共 ' + Object.keys(categoryMap).length + ' 个分类</p>';
  // 分类列表网格容器开始
  html += '<div class="category-list">';
  // 遍历所有分类
  for (var cat in categoryMap) {
    // 确保是自身属性
    if (categoryMap.hasOwnProperty(cat)) {
      // 每个分类生成一个卡片，带 fade-in 动画
      html += '<div class="category-card fade-in" onclick="showCategory(\'' + escapeHtml(cat) + '\')">';
      // 分类图标 Emoji
      html += '<div class="category-icon">' + getCategoryIcon(cat) + '</div>';
      // 分类名称
      html += '<h3>' + escapeHtml(cat) + '</h3>';
      // 文章数量
      html += '<span class="category-count">' + categoryMap[cat] + ' 篇文章</span>';
      // 分类卡片结束
      html += '</div>';
    }
  }
  // 分类列表容器结束
  html += '</div>';
  // 将 HTML 写入 #app 容器
  document.getElementById('app').innerHTML = html;
  // 滚动到页面顶部
  window.scrollTo(0, 0);
  // 触发渐入动画
  applyFadeIn();
}

/**
 * 渲染单个分类下的文章列表
 * @param {string} categoryName - 分类名称
 */
function renderCategory(categoryName) {
  // 高亮导航栏分类项
  highlightNav('categories');
  // 筛选属于该分类的文章
  var posts = POSTS.filter(function(post) {
    // filter 方法：只保留 category 等于 categoryName 的文章
    return post.category === categoryName;
  });
  // 按 id 降序排序
  posts.sort(function(a, b) { return b.id - a.id; });

  // 构建 HTML
  var html = '';
  // "返回分类列表"链接
  html += '<a href="#" class="back-link" onclick="showCategories(); return false;">← 返回分类列表</a>';
  // 页面标题：分类名称 + 图标
  html += '<h3 class="page-title">' + getCategoryIcon(categoryName) + ' ' + escapeHtml(categoryName) + '</h3>';
  // 副标题
  html += '<p class="page-subtitle">共 ' + posts.length + ' 篇文章</p>';
  // 插入文章卡片网格
  html += renderPostList(posts);
  // 将 HTML 写入 #app 容器
  document.getElementById('app').innerHTML = html;
  // 滚动到页面顶部
  window.scrollTo(0, 0);
  // 触发渐入动画
  applyFadeIn();
}

/**
 * 渲染归档页 — 按年份分组展示所有文章（时间线样式）
 */
function renderArchive() {
  // 高亮导航栏的"归档"按钮
  highlightNav('archive');
  // 获取排序后的文章列表
  var posts = getSortedPosts();
  // 构建按年份分组的对象
  var yearMap = {};
  // 遍历所有文章，按年份分组
  for (var i = 0; i < posts.length; i++) {
    // 从日期字符串中提取年份
    var year = posts[i].date.substring(0, 4);
    // 如果该年份尚未在 map 中，初始化为空数组
    if (!yearMap[year]) yearMap[year] = [];
    // 将文章添加到对应年份的数组中
    yearMap[year].push(posts[i]);
  }

  // 构建 HTML
  var html = '';
  // 页面标题
  html += '<h3 class="page-title">文章归档</h3>';
  // 副标题
  html += '<p class="page-subtitle">共 ' + posts.length + ' 篇文章</p>';
  // 获取年份数组并降序排序
  var years = Object.keys(yearMap).sort(function(a, b) { return parseInt(b) - parseInt(a); });
  // 遍历每个年份
  for (var y = 0; y < years.length; y++) {
    // 当前年份
    var year = years[y];
    // 年份区块开始，带 fade-in 动画
    html += '<div class="archive-year fade-in"><h3>' + year + ' 年</h3>';
    // 时间线列表开始
    html += '<ul class="archive-list">';
    // 遍历该年份下的每篇文章
    for (var k = 0; k < yearMap[year].length; k++) {
      // 当前文章
      var post = yearMap[year][k];
      // 时间线条目
      html += '<li class="archive-item" onclick="showPost(' + post.id + ')">';
      // 文章日期（月-日）
      html += '<span class="archive-date">' + post.date.substring(5) + '</span>';
      // 文章标题
      html += '<span class="archive-title">' + escapeHtml(post.title) + '</span>';
      // 时间线条目结束
      html += '</li>';
    }
    // 时间线列表和年份区块结束
    html += '</ul></div>';
  }
  // 将 HTML 写入 #app 容器
  document.getElementById('app').innerHTML = html;
  // 滚动到页面顶部
  window.scrollTo(0, 0);
  // 触发渐入动画
  applyFadeIn();
}

/**
 * 渲染关于页面 — 博主个人信息
 */
function renderAbout() {
  // 高亮导航栏的"关于"按钮
  highlightNav('about');
  // 构建 HTML
  var html = '';
  // 页面标题
  html += '<h3 class="page-title">关于我</h3>';
  // 关于内容容器开始
  html += '<div class="about-content fade-in">';
  // 头像 Emoji
  html += '<div class="about-avatar">🍃</div>';
  // 博主名称
  html += '<h3>清风</h3>';
  // 博主简介
  html += '<p>你好，我是清风，一名热爱技术的前端开发者。</p>';
  html += '<p>这个博客是我记录学习笔记和分享技术心得的地方。我相信"输出是最好的输入"，通过写文章来整理思路、巩固知识。</p>';
  // 技能列表标题
  html += '<h4>技术栈</h4>';
  // 技能标签容器
  html += '<div class="about-skills">';
  html += '<span class="skill-tag">HTML</span>';
  html += '<span class="skill-tag">CSS</span>';
  html += '<span class="skill-tag">JavaScript</span>';
  html += '<span class="skill-tag">响应式设计</span>';
  html += '<span class="skill-tag">前端工程化</span>';
  html += '</div>';
  // 联系方式标题
  html += '<h4>联系方式</h4>';
  // 联系方式列表
  html += '<ul class="about-contact">';
  html += '<li>📧 Email: qingfeng@example.com</li>';
  html += '<li>🐙 GitHub: github.com/qingfeng</li>';
  html += '</ul>';
  // 关于内容容器结束
  html += '</div>';
  // 将 HTML 写入 #app 容器
  document.getElementById('app').innerHTML = html;
  // 滚动到页面顶部
  window.scrollTo(0, 0);
  // 触发渐入动画
  applyFadeIn();
}

/**
 * 渲染搜索结果页 — 根据关键词过滤文章并展示
 */
function renderSearchResults() {
  // 不高亮任何导航项
  highlightNav('');
  // 获取全局搜索关键词，去除首尾空格
  var keyword = searchKeyword.trim();
  // 转为小写
  var lowerKeyword = keyword.toLowerCase();

  // 如果关键词为空，显示提示
  if (!keyword) {
    document.getElementById('app').innerHTML = '<div class="empty-state"><p>请在搜索框中输入关键词 🔍</p></div>';
    return; // 结束函数
  }

  // 过滤文章：标题、摘要、分类、标签中包含关键词的都算匹配
  var results = POSTS.filter(function(post) {
    // 检查标题
    var inTitle = post.title.toLowerCase().indexOf(lowerKeyword) !== -1;
    // 检查摘要
    var inExcerpt = post.excerpt.toLowerCase().indexOf(lowerKeyword) !== -1;
    // 检查分类
    var inCategory = post.category.toLowerCase().indexOf(lowerKeyword) !== -1;
    // 检查标签数组
    var inTags = post.tags.some(function(tag) {
      return tag.toLowerCase().indexOf(lowerKeyword) !== -1;
    });
    // 任一匹配即纳入结果
    return inTitle || inExcerpt || inCategory || inTags;
  });

  // 按 id 降序排序
  results.sort(function(a, b) { return b.id - a.id; });

  // 构建 HTML
  var html = '';
  // 搜索结果标题
  html += '<h3 class="page-title">搜索结果</h3>';
  // 副标题
  html += '<p class="page-subtitle">关键词「' + escapeHtml(keyword) + '」— 找到 ' + results.length + ' 篇文章</p>';
  // 插入文章卡片网格
  html += renderPostList(results);
  // 将 HTML 写入 #app 容器
  document.getElementById('app').innerHTML = html;
  // 滚动到页面顶部
  window.scrollTo(0, 0);
  // 触发渐入动画
  applyFadeIn();
}

/**
 * 渲染标签筛选页 — 展示包含指定标签的所有文章
 * @param {string} tagName - 标签名称
 */
function renderTag(tagName) {
  // 不高亮任何导航项
  highlightNav('');
  // 筛选包含该标签的文章
  var posts = POSTS.filter(function(post) {
    return post.tags.indexOf(tagName) !== -1;
  });
  // 按 id 降序排序
  posts.sort(function(a, b) { return b.id - a.id; });

  // 构建 HTML
  var html = '';
  // "返回首页"链接
  html += '<a href="#" class="back-link" onclick="showHome(); return false;">← 返回首页</a>';
  // 页面标题
  html += '<h3 class="page-title">#' + escapeHtml(tagName) + '</h3>';
  // 副标题
  html += '<p class="page-subtitle">共 ' + posts.length + ' 篇文章</p>';
  // 插入文章卡片网格
  html += renderPostList(posts);
  // 将 HTML 写入 #app 容器
  document.getElementById('app').innerHTML = html;
  // 滚动到页面顶部
  window.scrollTo(0, 0);
  // 触发渐入动画
  applyFadeIn();
}


// ==================== 导航入口函数（供 HTML onclick 调用）====================

/**
 * 显示首页 — 供导航栏和 Logo 的 onclick 调用
 */
function showHome() {
  // 清空搜索关键词缓存
  searchKeyword = '';
  // 清空搜索框的文本内容
  var searchInput = document.querySelector('.nav-search');
  // 如果搜索框元素存在
  if (searchInput) searchInput.value = '';
  // 调用渲染函数
  renderHome();
}

/**
 * 回到首页（Logo 点击时调用）
 */
function goHome() {
  showHome();
}

/**
 * 显示分类页 — 供导航栏 onclick 调用
 */
function showCategories() {
  renderCategories();
}

/**
 * 显示单个分类的文章列表
 * @param {string} name - 分类名称
 */
function showCategory(name) {
  renderCategory(name);
}

/**
 * 显示归档页
 */
function showArchive() {
  renderArchive();
}

/**
 * 显示关于页
 */
function showAbout() {
  renderAbout();
}

/**
 * 显示文章详情
 * @param {number} id - 文章 id
 */
function showPost(id) {
  renderPost(id);
}

/**
 * 显示标签筛选页
 * @param {string} name - 标签名称
 */
function showTag(name) {
  renderTag(name);
}

/**
 * 处理搜索输入 — 搜索框 oninput 事件触发
 * @param {string} value - 搜索框当前输入值
 */
function handleSearch(value) {
  // XSS 防护：限制搜索输入长度，防止超长输入
  if (value.length > 100) value = value.substring(0, 100);
  // 将输入值保存到全局变量（escapeHtml 已在渲染时调用，这里不需要二次转义）
  searchKeyword = value;
  // 如果输入值为空，返回首页
  if (!value.trim()) {
    renderHome();
    return;
  }
  // 否则渲染搜索结果页
  renderSearchResults();
}


// ==================== 主题切换（日/夜间模式）====================

/**
 * 切换主题 — 在日间模式和夜间模式之间切换
 */
function toggleTheme() {
  // 获取 html 元素
  var html = document.documentElement;
  // 检查当前是否已经是夜间模式
  var isDark = html.classList.contains('dark');
  // 如果当前是夜间模式
  if (isDark) {
    // 移除 dark 类，切换回日间模式
    html.classList.remove('dark');
    // 更新主题按钮图标为月亮
    document.getElementById('theme-btn').textContent = '🌙';
    // 将主题偏好保存到 localStorage
    localStorage.setItem('blog-theme', 'light');
  } else {
    // 添加 dark 类切换到夜间模式
    html.classList.add('dark');
    // 更新主题按钮图标为太阳
    document.getElementById('theme-btn').textContent = '☀️';
    // 将主题偏好保存到 localStorage
    localStorage.setItem('blog-theme', 'dark');
  }
}

/**
 * 初始化主题 — 页面加载时根据 localStorage 中的偏好恢复主题
 */
function initTheme() {
  // 从 localStorage 读取保存的主题偏好
  var savedTheme = localStorage.getItem('blog-theme');
  // 如果保存的主题是夜间模式
  if (savedTheme === 'dark') {
    // 给 html 元素添加 dark 类
    document.documentElement.classList.add('dark');
    // 更新按钮图标为太阳
    document.getElementById('theme-btn').textContent = '☀️';
  }
}


// ==================== 背景音乐控制 ====================

/**
 * 标记用户是否已经与页面交互过（点击/触摸）
 * 手机浏览器要求：音频的 play() 必须在用户交互事件的同步调用栈中执行，
 * 异步回调（Promise.then / setTimeout）中调用 play() 会被阻止。
 * 因此需要用一个标记来记录"已获得播放权限"。
 */
var _audioUnlocked = false;

/**
 * 标记用户首次交互，解锁手机浏览器音频播放权限
 * 在用户首次点击/触摸页面时调用，设置 _audioUnlocked = true，
 * 之后点击音乐按钮时就可以正常播放。
 * 同时尝试播放一段静音来"激活"音频通道（部分手机需要此步骤）。
 */
function unlockAudioOnInteraction() {
  // 如果已经解锁过，直接返回
  if (_audioUnlocked) return;
  // 标记为已解锁
  _audioUnlocked = true;
  // 尝试播放音频元素（静音方式）来激活音频通道
  var audio = document.getElementById('bgm-audio');
  if (!audio) return;
  // 先静音，播放，再暂停，再恢复音量 — 这是手机上激活音频通道的标准技巧
  var oldVol = audio.volume;
  audio.volume = 0;
  // 调用 play()（在同步调用栈中）激活音频通道
  var playPromise = audio.play();
  // 立即暂停并恢复音量
  if (playPromise !== undefined) {
    playPromise.then(function() {
      audio.pause();
      audio.volume = oldVol;
    }).catch(function() {
      // 播放失败不影响，只是激活失败
      audio.volume = oldVol;
    });
  } else {
    // 旧浏览器 play() 不返回 Promise
    audio.pause();
    audio.volume = oldVol;
  }
}

/**
 * 切换音乐播放/暂停 — 导航栏音乐按钮点击时调用
 * 浏览器自动播放策略要求：必须由用户交互（如点击）触发播放。
 * 手机浏览器额外要求：play() 必须在事件同步调用栈中执行。
 * 因此不再使用 audio.play().then() 异步更新 UI，
 * 而是直接同步调用 play()，再同步更新按钮状态。
 */
function toggleMusic() {
  // 获取 <audio> 音频元素
  var audio = document.getElementById('bgm-audio');
  // 获取导航栏音乐按钮元素
  var btn = document.getElementById('music-btn');
  // 如果音频元素不存在，直接返回
  if (!audio) { return; }
  // 检查当前是否处于暂停状态
  if (audio.paused) {
    // 当前暂停 → 直接在用户点击的同步调用栈中调用 play()
    // 这是手机浏览器能正常播放的唯一方式
    var playPromise = audio.play();
    // 同步更新按钮状态（不放在 .then() 中，因为手机上 .then 回调可能来不及）
    btn.textContent = '🎵';
    btn.classList.add('playing');
    saveMusicState(true);
    // 如果 play() 返回了 Promise，处理可能的失败
    if (playPromise !== undefined) {
      playPromise.catch(function(e) {
        // 播放失败（文件不存在或浏览器策略阻止）
        btn.textContent = '🔇';
        btn.classList.remove('playing');
        saveMusicState(false);
      });
    }
  } else {
    // 当前正在播放 → 调用 pause() 暂停
    audio.pause();
    // 按钮图标恢复
    btn.textContent = '🎵';
    btn.classList.remove('playing');
    saveMusicState(false);
  }
}

/**
 * 初始化音乐状态 — 页面加载时检查上次的音乐播放偏好
 *
 * 手机浏览器特别处理：
 * 1. 监听首次用户交互（touchstart / click / keydown）解锁音频权限
 * 2. 首次交互后同步调用 play()（不在异步回调中）
 * 3. 首次交互时自动播放音乐（如果上次保存的状态是"播放中"）
 * 4. 同时使用 AudioContext 进一步确保手机 Safari 音频通道激活
 */
function initMusic() {
  // 从 localStorage 读取音乐偏好
  var savedMusic = localStorage.getItem('blog-music');
  // 获取音频元素
  var audio = document.getElementById('bgm-audio');
  // 获取按钮元素
  var btn = document.getElementById('music-btn');
  // 如果音频元素或按钮不存在，返回
  if (!audio || !btn) return;
  // 设置初始音量为 0.4（40%），避免音量过大打扰用户
  audio.volume = 0.4;

  /**
   * 首次交互处理函数 — 在用户首次触摸/点击页面时触发
   * 核心要点：play() 必须在事件监听器的同步调用栈中直接调用，
   * 不能包在 setTimeout / Promise.then 等异步回调中，
   * 否则手机浏览器会拒绝播放。
   */
  function onFirstInteraction() {
    // 如果已经解锁过，不需要重复处理
    if (_audioUnlocked) return;
    // 标记已解锁
    _audioUnlocked = true;
    // 如果上次保存的状态是"播放中"，立即在同步调用栈中播放
    if (savedMusic === 'playing') {
      // 直接调用 play()（在事件监听器的同步调用栈中）
      var p = audio.play();
      // 同步更新按钮
      btn.textContent = '🎵';
      btn.classList.add('playing');
      // 处理可能的失败
      if (p !== undefined) {
        p.catch(function() {
          btn.textContent = '🎵';
          btn.classList.remove('playing');
        });
      }
    }
    // 交互完成后移除所有监听器
    document.removeEventListener('touchstart', onFirstInteraction);
    document.removeEventListener('touchend', onFirstInteraction);
    document.removeEventListener('click', onFirstInteraction);
    document.removeEventListener('keydown', onFirstInteraction);
  }

  // 如果上次保存的状态是"播放中"，注册首次交互监听器
  if (savedMusic === 'playing') {
    // 先尝试直接播放（桌面浏览器可能允许，但手机大概率会失败）
    var tryDirect = audio.play();
    if (tryDirect !== undefined) {
      tryDirect.then(function() {
        // 桌面浏览器直接播放成功
        btn.textContent = '🎵';
        btn.classList.add('playing');
        _audioUnlocked = true;
      }).catch(function() {
        // 手机浏览器拒绝自动播放 → 注册交互监听器等待用户点击
        document.addEventListener('touchstart', onFirstInteraction);
        document.addEventListener('touchend', onFirstInteraction);
        document.addEventListener('click', onFirstInteraction);
        document.addEventListener('keydown', onFirstInteraction);
      });
    }
  }

  // 同时也注册一个全局的首次交互解锁（即使不是恢复播放，也解锁音频权限）
  // 这样用户点击音乐按钮时就不会被阻止
  document.addEventListener('touchstart', unlockAudioOnInteraction, { once: true });
  document.addEventListener('click', unlockAudioOnInteraction, { once: true });
}

/**
 * 保存音乐播放状态到 localStorage
 * @param {boolean} isPlaying - 是否正在播放
 */
function saveMusicState(isPlaying) {
  // 根据 isPlaying 参数保存对应的状态值
  localStorage.setItem('blog-music', isPlaying ? 'playing' : 'paused');
}


// ==================== 回到顶部按钮控制 ====================

/**
 * 滚动到页面顶部 — 平滑滚动
 */
function scrollToTop() {
  // 使用 window.scrollTo 的 smooth 行为
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 监听页面滚动 — 控制回到顶部按钮的显示/隐藏
 */
function handleScroll() {
  // 获取回到顶部按钮元素
  var btn = document.getElementById('back-to-top');
  // 如果滚动距离大于 300 像素
  if (window.scrollY > 300) {
    // 添加 visible 类使按钮可见
    btn.classList.add('visible');
  } else {
    // 否则移除 visible 类隐藏按钮
    btn.classList.remove('visible');
  }
}


// ==================== 初始化 ====================

/**
 * 页面加载完成后执行的初始化函数
 */
function init() {
  // 第一步：恢复用户保存的主题偏好
  initTheme();

  // 第一点五步：初始化背景音乐（恢复上次的播放状态）
  initMusic();

  // 第二步：为导航栏按钮添加 data-nav 属性（index.html 中已有 data-nav，这里做兼容备份）
  var navLinks = document.querySelectorAll('.nav-link');
  var navNames = ['home', 'categories', 'archive', 'about'];
  for (var i = 0; i < 4 && i < navLinks.length; i++) {
    // 如果尚未设置 data-nav，则设置
    if (!navLinks[i].getAttribute('data-nav')) {
      navLinks[i].setAttribute('data-nav', navNames[i]);
    }
  }

  // 第三步：绑定窗口滚动事件
  window.addEventListener('scroll', handleScroll);

  // 第四步：渲染首页内容
  renderHome();
}

// 当 DOM 内容加载完成后调用 init 函数
document.addEventListener('DOMContentLoaded', init);
