const fs = require('fs');
const path = require('path');

const injectionCode = `
<!-- VivoQuest Industry-Standard Collapsible Sidebar & Navigation System -->
<style id="vq-sidebar-system-css">
/* Smooth collapsible sidebar transitions */
aside.side, aside.side2, aside.av-side, aside.sidebar {
  transition: width 0.24s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.24s cubic-bezier(0.4, 0, 0.2, 1), padding 0.24s cubic-bezier(0.4, 0, 0.2, 1) !important;
  position: relative !important;
  box-sizing: border-box !important;
}

/* Collapsed State (76px width) */
aside.side.collapsed, aside.side2.collapsed, aside.av-side.collapsed, aside.sidebar.collapsed {
  width: 76px !important;
  min-width: 76px !important;
  padding: 16px 8px !important;
}

aside.side.collapsed .nh,
aside.side.collapsed .sub,
aside.side.collapsed .cnt,
aside.side.collapsed .navb span,
aside.side.collapsed .btn span,
aside.side.collapsed [style*="font-size:19px"],
aside.side.collapsed [style*="font-size:20px"],
aside.side.collapsed .avatar + div,
aside.side2.collapsed .nh,
aside.side2.collapsed span,
aside.av-side.collapsed h3,
aside.av-side.collapsed label,
aside.av-side.collapsed .sub,
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
}

/* Modern Top Controls Bar (Back + Minimize) */
.vq-sidebar-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 0 4px 12px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(230, 226, 240, 0.6);
  width: 100%;
  box-sizing: border-box;
}
aside.collapsed .vq-sidebar-controls {
  flex-direction: column;
  padding: 0 0 10px;
  gap: 8px;
}

.vq-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #F7F5FF;
  border: 1px solid #ECE7FB;
  color: #4520B8;
  padding: 6px 12px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  font-family: inherit;
}
.vq-back-btn:hover {
  background: #4520B8;
  color: #FFFFFF;
  border-color: #4520B8;
  box-shadow: 0 2px 6px rgba(69, 32, 184, 0.2);
}
aside.collapsed .vq-back-btn {
  padding: 6px !important;
}
aside.collapsed .vq-back-btn span {
  display: none !important;
}

.vq-minimize-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #ECE7FB;
  background: #FFFFFF;
  color: #4520B8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.vq-minimize-btn:hover {
  background: #4520B8;
  color: #FFFFFF;
  border-color: #4520B8;
  box-shadow: 0 2px 6px rgba(69, 32, 184, 0.2);
}

/* Header back button for screens without aside */
.vq-header-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #F7F5FF;
  border: 1px solid #ECE7FB;
  color: #4520B8;
  padding: 6px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-right: 12px;
  font-family: inherit;
}
.vq-header-back-btn:hover {
  background: #4520B8;
  color: #FFFFFF;
  border-color: #4520B8;
}
</style>

<script id="vq-sidebar-system-js">
(function() {
  function setupNavigationAndSidebar() {
    var isStoredCollapsed = localStorage.getItem('vivoquest_sidebar_collapsed') === 'true';

    // 1. Check for aside sidebar
    var aside = document.querySelector('aside.side, aside.side2, aside.av-side, aside');
    if (aside && !aside.dataset.vqEnhanced) {
      aside.dataset.vqEnhanced = 'true';

      if (isStoredCollapsed) {
        aside.classList.add('collapsed');
      }

      // Create Sidebar Controls Bar
      var controls = document.createElement('div');
      controls.className = 'vq-sidebar-controls';
      controls.innerHTML = [
        '<button class="vq-back-btn" title="Go back to previous page (Alt + ←)" type="button">',
        '  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
        '  <span>Back</span>',
        '</button>',
        '<button class="vq-minimize-btn" title="' + (isStoredCollapsed ? 'Expand sidebar' : 'Minimize sidebar') + '" type="button">',
        '  <svg class="vq-chevron-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform:' + (isStoredCollapsed ? 'rotate(180deg)' : 'rotate(0deg)') + ';transition:transform 0.2s ease">',
        '    <path d="M15 18l-6-6 6-6"/>',
        '  </svg>',
        '</button>'
      ].join('');

      aside.insertBefore(controls, aside.firstChild);

      var backBtn = controls.querySelector('.vq-back-btn');
      var minBtn = controls.querySelector('.vq-minimize-btn');
      var chevron = controls.querySelector('.vq-chevron-icon');

      backBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        triggerGoBack();
      });

      minBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var nowCollapsed = aside.classList.toggle('collapsed');
        localStorage.setItem('vivoquest_sidebar_collapsed', nowCollapsed ? 'true' : 'false');
        minBtn.title = nowCollapsed ? 'Expand sidebar' : 'Minimize sidebar';
        chevron.style.transform = nowCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
      });

      // Enhance all sidebar nav buttons with clean title tooltips
      aside.querySelectorAll('button.navb, button.btn, button.nav-item').forEach(function(btn) {
        var txt = (btn.textContent || '').trim();
        if (txt && !btn.title) {
          btn.title = txt;
        }
      });
    }

    // 2. For header-based screens without aside, add clean Back button to header if not present
    if (!aside) {
      var headerRow = document.querySelector('header .row, header, .top .row, .top2 .row');
      if (headerRow && !headerRow.querySelector('.vq-header-back-btn')) {
        var headerBackBtn = document.createElement('button');
        headerBackBtn.className = 'vq-header-back-btn';
        headerBackBtn.title = 'Go back to previous page';
        headerBackBtn.type = 'button';
        headerBackBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg><span>Back</span>';
        headerBackBtn.addEventListener('click', function(e) {
          e.preventDefault();
          triggerGoBack();
        });
        headerRow.insertBefore(headerBackBtn, headerRow.firstChild);
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

  // Keyboard shortcut: Alt + LeftArrow triggers Back
  window.addEventListener('keydown', function(e) {
    if (e.altKey && e.key === 'ArrowLeft') {
      triggerGoBack();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNavigationAndSidebar);
  } else {
    setupNavigationAndSidebar();
  }
})();
</script>
`;

const dirs = [
  'vivoquest-frontend/public/screens',
  'frontend/public/screens'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  files.forEach(f => {
    const fullPath = path.join(dir, f);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove old enhancer if already present
    content = content.replace(/<!-- VivoQuest Industry-Standard Collapsible Sidebar[\s\S]*?<\/script>/gi, '');
    
    // Inject right before </body>
    if (content.includes('</body>')) {
      content = content.replace('</body>', `${injectionCode}\n</body>`);
    } else {
      content += `\n${injectionCode}`;
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`Injected sidebar system into ${fullPath}`);
  });
});
