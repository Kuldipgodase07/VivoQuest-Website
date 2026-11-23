const fs = require('fs');
const zlib = require('zlib');

const controlsHtml = `<!-- VivoQuest Master Sidebar Controls -->
<div class="vq-sidebar-controls" data-vq-controls="true">
  <button class="vq-back-btn" title="Go back to previous page (Alt + ←)" type="button">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
    <span>Back</span>
  </button>
  <button class="vq-minimize-btn" title="Minimize sidebar" type="button">
    <svg class="vq-chevron-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  </button>
</div>`;

const headerBackHtml = `<button class="vq-header-back-btn" title="Go back to previous page (Alt + ←)" type="button">
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
  <span>Back</span>
</button>`;

const stylesCss = `
<!-- VivoQuest Enterprise Sidebar & Navigation System -->
<style id="vq-sidebar-system-css">
/* Base Smooth Sidebar Transitions */
aside.side, aside.side2, aside.av-side, aside.sidebar {
  transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.22s cubic-bezier(0.4, 0, 0.2, 1), padding 0.22s cubic-bezier(0.4, 0, 0.2, 1) !important;
  position: relative !important;
  box-sizing: border-box !important;
}

/* Collapsed State (76px icon rail) */
aside.side.collapsed, aside.side2.collapsed, aside.av-side.collapsed, aside.sidebar.collapsed {
  width: 76px !important;
  min-width: 76px !important;
  max-width: 76px !important;
  flex: 0 0 76px !important;
  padding: 16px 8px !important;
}

/* Controls Bar */
.vq-sidebar-controls {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
  padding: 0 2px 12px !important;
  margin-bottom: 10px !important;
  border-bottom: 1px solid rgba(230, 226, 240, 0.45) !important;
  width: 100% !important;
  box-sizing: border-box !important;
  flex-shrink: 0 !important;
}

aside.collapsed .vq-sidebar-controls {
  flex-direction: column !important;
  padding: 0 0 10px !important;
  gap: 8px !important;
}

/* Back Button */
.vq-back-btn {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  background: rgba(69, 32, 184, 0.08) !important;
  border: 1px solid rgba(69, 32, 184, 0.18) !important;
  color: #4520B8 !important;
  padding: 6px 12px !important;
  border-radius: 9px !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
  user-select: none !important;
  font-family: inherit !important;
  line-height: 1 !important;
}

.vq-back-btn:hover {
  background: #4520B8 !important;
  color: #FFFFFF !important;
  border-color: #4520B8 !important;
  box-shadow: 0 2px 8px rgba(69, 32, 184, 0.25) !important;
}

/* Dark sidebar overrides */
aside.side:not([style*="background:#fff"]):not([style*="background: #fff"]):not([style*="background: rgb(255, 255, 255)"]) .vq-back-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.28) !important;
  color: #FFFFFF !important;
}
aside.side:not([style*="background:#fff"]):not([style*="background: #fff"]):not([style*="background: rgb(255, 255, 255)"]) .vq-back-btn:hover {
  background: #FFFFFF !important;
  color: #4520B8 !important;
  border-color: #FFFFFF !important;
}

aside.collapsed .vq-back-btn {
  padding: 7px !important;
  width: 32px !important;
  height: 32px !important;
  justify-content: center !important;
}

aside.collapsed .vq-back-btn span {
  display: none !important;
}

/* Minimize Toggle Button */
.vq-minimize-btn {
  width: 32px !important;
  height: 32px !important;
  border-radius: 9px !important;
  border: 1px solid rgba(69, 32, 184, 0.18) !important;
  background: #FFFFFF !important;
  color: #4520B8 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
  user-select: none !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06) !important;
  flex-shrink: 0 !important;
  padding: 0 !important;
}

.vq-minimize-btn:hover {
  background: #4520B8 !important;
  color: #FFFFFF !important;
  border-color: #4520B8 !important;
  box-shadow: 0 2px 8px rgba(69, 32, 184, 0.25) !important;
}

aside.side:not([style*="background:#fff"]):not([style*="background: #fff"]):not([style*="background: rgb(255, 255, 255)"]) .vq-minimize-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.28) !important;
  color: #FFFFFF !important;
}
aside.side:not([style*="background:#fff"]):not([style*="background: #fff"]):not([style*="background: rgb(255, 255, 255)"]) .vq-minimize-btn:hover {
  background: #FFFFFF !important;
  color: #4520B8 !important;
  border-color: #FFFFFF !important;
}

.vq-chevron-icon {
  transition: transform 0.22s ease !important;
}

aside.collapsed .vq-chevron-icon {
  transform: rotate(180deg) !important;
}

/* Collapsed Navigation Items: center icons, hide labels */
aside.side.collapsed .nh,
aside.side.collapsed .sub,
aside.side.collapsed .cnt,
aside.side.collapsed .navb span,
aside.side.collapsed .btn span,
aside.side.collapsed [style*="font-size:19px"],
aside.side.collapsed [style*="font-size:20px"],
aside.side.collapsed .avatar + div,
aside.side.collapsed .row > div:not([style*="width:42px"]):not([style*="width:44px"]):not(.avatar),
aside.side2.collapsed .nh,
aside.side2.collapsed span,
aside.side2.collapsed .row > div:not([style*="width:42px"]):not([style*="width:44px"]),
aside.av-side.collapsed h2 span,
aside.av-side.collapsed h3,
aside.av-side.collapsed label,
aside.av-side.collapsed .sub,
aside.av-side.collapsed div:not(.vq-sidebar-controls),
aside.collapsed .vq-hide-collapsed {
  display: none !important;
}

aside.side.collapsed .navb, aside.side2.collapsed .navb {
  justify-content: center !important;
  padding: 10px 0 !important;
}

aside.side.collapsed .navb svg, aside.side2.collapsed .navb svg {
  margin: 0 !important;
}

aside.side.collapsed .row {
  justify-content: center !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

/* Header Back Button */
.vq-header-back-btn {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  background: #FFFFFF !important;
  border: 1.5px solid #E6E2F0 !important;
  color: #4520B8 !important;
  padding: 7px 14px !important;
  border-radius: 11px !important;
  font-size: 13px !important;
  font-weight: 800 !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
  margin-right: 14px !important;
  font-family: inherit !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
  line-height: 1 !important;
  user-select: none !important;
}

.vq-header-back-btn:hover {
  background: #4520B8 !important;
  color: #FFFFFF !important;
  border-color: #4520B8 !important;
  box-shadow: 0 4px 12px rgba(69, 32, 184, 0.25) !important;
}
</style>

<!-- VivoQuest Resilient Sidebar & Back Controller -->
<script id="vq-sidebar-system-js">
(function() {
  function isCollapsedStored() {
    try {
      return localStorage.getItem('vivoquest_sidebar_collapsed') === 'true';
    } catch(e) {
      return false;
    }
  }

  function applyCollapsedState(aside, collapsed) {
    if (!aside) return;
    if (collapsed) {
      aside.classList.add('collapsed');
    } else {
      aside.classList.remove('collapsed');
    }
    var minBtn = aside.querySelector('.vq-minimize-btn');
    if (minBtn) {
      minBtn.title = collapsed ? 'Expand sidebar' : 'Minimize sidebar';
    }
    var chevron = aside.querySelector('.vq-chevron-icon');
    if (chevron) {
      chevron.style.transform = collapsed ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  }

  function ensureSidebarControls() {
    var isCol = isCollapsedStored();

    var aside = document.querySelector('aside.side, aside.side2, aside.av-side, aside');
    if (aside) {
      applyCollapsedState(aside, isCol);

      if (!aside.querySelector('.vq-sidebar-controls')) {
        var ctrl = document.createElement('div');
        ctrl.className = 'vq-sidebar-controls';
        ctrl.setAttribute('data-vq-controls', 'true');
        ctrl.innerHTML = [
          '<button class="vq-back-btn" title="Go back to previous page (Alt + ←)" type="button">',
          '  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
          '  <span>Back</span>',
          '</button>',
          '<button class="vq-minimize-btn" title="' + (isCol ? 'Expand sidebar' : 'Minimize sidebar') + '" type="button">',
          '  <svg class="vq-chevron-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform:' + (isCol ? 'rotate(180deg)' : 'rotate(0deg)') + '">',
          '    <path d="M15 18l-6-6 6-6"/>',
          '  </svg>',
          '</button>'
        ].join('');
        aside.insertBefore(ctrl, aside.firstChild);
      }

      aside.querySelectorAll('button.navb, button.btn, button.nav-item, nav button').forEach(function(btn) {
        var txt = (btn.textContent || '').trim();
        if (txt && !btn.title) {
          btn.title = txt;
        }
      });
    }

    // 2. Check for header without aside (only in non-landing screens with header.top2)
    if (!aside) {
      var isHome = window.location.pathname.indexOf('landing') !== -1 || window.location.pathname === '/' || document.querySelector('header.nav');
      if (!isHome) {
        var headerRow = document.querySelector('header.top2 .row, .top2 .row');
        if (headerRow && !headerRow.querySelector('.vq-header-back-btn')) {
          var hBack = document.createElement('button');
          hBack.className = 'vq-header-back-btn';
          hBack.title = 'Go back to previous page';
          hBack.type = 'button';
          hBack.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg><span>Back</span>';
          headerRow.insertBefore(hBack, headerRow.firstChild);
        }
      }
    }
  }

  function triggerGoBack() {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'NAVIGATE_BACK' }, '*');
    }
    if (window.history && window.history.length > 1) {
      window.history.back();
    } else {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'NAVIGATE', path: '/' }, '*');
      } else {
        window.location.href = '/';
      }
    }
  }

  document.addEventListener('click', function(e) {
    var backBtn = e.target.closest('.vq-back-btn, .vq-header-back-btn');
    if (backBtn) {
      e.preventDefault();
      e.stopPropagation();
      triggerGoBack();
      return;
    }

    var minBtn = e.target.closest('.vq-minimize-btn');
    if (minBtn) {
      e.preventDefault();
      e.stopPropagation();
      var aside = document.querySelector('aside.side, aside.side2, aside.av-side, aside');
      if (aside) {
        var willCollapse = !aside.classList.contains('collapsed');
        try {
          localStorage.setItem('vivoquest_sidebar_collapsed', willCollapse ? 'true' : 'false');
        } catch(err) {}
        applyCollapsedState(aside, willCollapse);
      }
      return;
    }
  }, true);

  window.addEventListener('keydown', function(e) {
    if (e.altKey && e.key === 'ArrowLeft') {
      triggerGoBack();
    }
  });

  ensureSidebarControls();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureSidebarControls);
  }
  window.addEventListener('load', ensureSidebarControls);

  try {
    var obs = new MutationObserver(function() {
      ensureSidebarControls();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  } catch(e) {}

  var safetyCounter = 0;
  var timer = setInterval(function() {
    ensureSidebarControls();
    safetyCounter++;
    if (safetyCounter > 20) clearInterval(timer);
  }, 250);
})();
</script>
`;

function upgradeHtmlContent(content) {
  content = content.replace(/<!-- VivoQuest [^>]*-->\s*<style id="vq-sidebar-system-css">[\s\S]*?<\/style>/g, '');
  content = content.replace(/<script id="vq-sidebar-system-js">[\s\S]*?<\/script>/g, '');
  content = content.replace(/<style id="vq-sidebar-system-css">[\s\S]*?<\/style>/g, '');

  const asideMatch = content.match(/<aside\b[^>]*>/i);
  if (asideMatch) {
    const asideTag = asideMatch[0];
    content = content.replace(/<div class="vq-sidebar-controls"[\s\S]*?<\/div>\s*/g, '');
    content = content.replace(asideTag, asideTag + '\n' + controlsHtml);
  } else {
    const headerRowMatch = content.match(/(<header[^>]*>\s*<div class="row">)/i);
    if (headerRowMatch) {
      content = content.replace(/<button class="vq-header-back-btn"[\s\S]*?<\/button>\s*/g, '');
      content = content.replace(headerRowMatch[1], headerRowMatch[1] + '\n' + headerBackHtml);
    }
  }

  if (content.includes('</body>')) {
    content = content.replace('</body>', stylesCss + '\n</body>');
  } else {
    content = content + '\n' + stylesCss;
  }

  return content;
}

const bundlePath = 'VivoQuest Web App.html';
if (fs.existsSync(bundlePath)) {
  let fileContent = fs.readFileSync(bundlePath, 'utf8');
  const manifestMatch = fileContent.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
  if (manifestMatch) {
    const manifest = JSON.parse(manifestMatch[1]);
    let count = 0;
    Object.keys(manifest).forEach(uuid => {
      const item = manifest[uuid];
      if (item.mime === 'text/html' && item.compressed && item.data) {
        try {
          const rawBuffer = Buffer.from(item.data, 'base64');
          const decompressed = zlib.gunzipSync(rawBuffer).toString('utf8');
          if (decompressed.includes('landing') || decompressed.includes('exploreRoles') || decompressed.includes('navRoles')) {
            // Skip landing page in bundle
            return;
          }
          const upgraded = upgradeHtmlContent(decompressed);
          const recompressed = zlib.gzipSync(Buffer.from(upgraded, 'utf8')).toString('base64');
          item.data = recompressed;
          count++;
        } catch (err) {
          console.error(`Error processing bundle item ${uuid}:`, err.message);
        }
      }
    });

    const newManifestJson = JSON.stringify(manifest);
    fileContent = fileContent.replace(
      /<script type="__bundler\/manifest">[\s\S]*?<\/script>/,
      `<script type="__bundler/manifest">${newManifestJson}</script>`
    );
    fs.writeFileSync(bundlePath, fileContent, 'utf8');
    console.log(`Successfully upgraded ${count} bundled pages inside ${bundlePath}!`);
  }
}
